/* ================================================================
   GESTION DES PRIX — Les Cinq Frères
   Logique partagée entre catalogue.html (affichage) et dashboard.html
   (page admin "Gestion des Prix"). Opère sur l'objet `catalogue`
   défini dans catalogue-data.js.
   ================================================================ */

/* Formate un prix numérique (en DT) dans le style du site : "5,500 DT" */
function formatDT(n) {
  return Number(n).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false }).replace('.', ',') + ' DT';
}

/* Lit un nombre depuis une étiquette "... 5,500 DT ..." */
function parsePriceStr(str) {
  if (!str) return 0;
  const m = String(str).match(/(\d[\d,]*)\s*DT/);
  if (!m) return 0;
  return parseFloat(m[1].replace(',', '.')) || 0;
}

/* Remplace le prix dans une étiquette de variante, en gardant le libellé ("Gold — Sur devis" -> "Gold — 5,500 DT"). */
function replaceVariantPrice(variantStr, newPrice) {
  const formatted = formatDT(newPrice);
  const str = String(variantStr);
  const sepIdx = str.lastIndexOf(' — ');
  if (sepIdx !== -1) {
    return str.slice(0, sepIdx) + ' — ' + formatted;
  }
  if (/\d[\d,]*\s*DT/.test(str)) {
    return str.replace(/\d[\d,]*\s*DT/, formatted);
  }
  return formatted;
}

/* Parcourt tout le catalogue et retourne une liste à plat de chaque unité de prix modifiable.
   Chaque entrée a une `key` stable utilisée comme id de document Firestore pour l'override.
   `tools` est le tableau séparé `toolCategories` (Outils de Tapisserie, hors de l'objet catalogue). */
function flattenPriceableItems(cat, tools) {
  const out = [];
  (tools || []).forEach(tc => {
    (tc.items || []).forEach(it => {
      out.push({ key: it.code, catId: 'outils', catLabel: 'Outils de Tapisserie', group: tc.name, label: it.name, price: parsePriceStr(it.price), kind: 'tool' });
    });
  });
  Object.entries(cat).forEach(([catId, c]) => {
    if (Array.isArray(c.products)) {
      c.products.forEach(p => {
        const variants = (p.variants && p.variants.length) ? p.variants : [p.price || ''];
        variants.forEach((v, vi) => {
          const parts = String(v).split(' — ');
          const label = variants.length > 1 ? (parts.length > 1 ? parts.slice(0, -1).join(' — ') : v) : 'Prix';
          out.push({
            key: vi === 0 ? p.id : (p.id + '::v' + vi),
            catId, catLabel: c.label || catId,
            group: p.name,
            label,
            price: parsePriceStr(v) || parsePriceStr(p.price),
            kind: 'product',
          });
        });
      });
    }
    if (c.isTissuPage && Array.isArray(c.collections)) {
      c.collections.forEach(col => {
        out.push({ key: col.id, catId, catLabel: c.label || catId, group: 'Tissus d\'Ameublement', label: col.label, price: col.priceNum || parsePriceStr(col.price), kind: 'tissu' });
      });
    }
    if (c.isMoussePage && Array.isArray(c.types)) {
      c.types.forEach(t => (t.dims || []).forEach(d => {
        out.push({ key: d.code, catId, catLabel: c.label || catId, group: 'Matelas Mousse — ' + t.label, label: d.d, price: d.prix || 0, kind: 'mousse-dim' });
      }));
    }
    if (c.isTabkaPage && Array.isArray(c.types)) {
      c.types.forEach(t => (t.thicknesses || []).forEach(th => {
        out.push({ key: th.code, catId, catLabel: c.label || catId, group: 'TABKA — ' + t.label, label: th.ep + (th.dim ? ' — ' + th.dim : ''), price: th.prix || 0, kind: 'tabka-th' });
      }));
    }
    if (c.isRessortPage && Array.isArray(c.types) && Array.isArray(c.sizes)) {
      c.sizes.forEach(s => {
        c.types.forEach((t, ti) => {
          const p = s.prices[ti];
          if (p === null || p === undefined) return;
          out.push({ key: 'ressort::' + t.id + '::' + s.dim, catId, catLabel: c.label || catId, group: 'Matelas Ressort — ' + t.label, label: s.dim, price: p, kind: 'ressort-cell' });
        });
      });
    }
  });
  return out;
}

/* Applique une table d'overrides {key: nouveauPrix(number)} directement sur l'objet catalogue
   (et sur `tools` = toolCategories s'il est fourni) — mutation en place. */
function applyPriceOverrides(cat, overrides, tools) {
  if (!overrides || !Object.keys(overrides).length) return;
  (tools || []).forEach(tc => {
    (tc.items || []).forEach(it => {
      if (overrides[it.code] !== undefined) it.price = formatDT(overrides[it.code]);
    });
  });
  Object.values(cat).forEach(c => {
    if (Array.isArray(c.products)) {
      c.products.forEach(p => {
        let changed = false;
        if (p.variants && p.variants.length) {
          p.variants.forEach((v, vi) => {
            const key = vi === 0 ? p.id : (p.id + '::v' + vi);
            if (overrides[key] !== undefined) {
              p.variants[vi] = replaceVariantPrice(v, overrides[key]);
              changed = true;
            }
          });
          if (changed) {
            const prices = p.variants.map(v => parsePriceStr(v)).filter(n => n > 0);
            if (prices.length) p.price = formatDT(Math.min(...prices));
          }
        } else if (overrides[p.id] !== undefined) {
          p.price = formatDT(overrides[p.id]);
        }
      });
    }
    if (c.isTissuPage && Array.isArray(c.collections)) {
      c.collections.forEach(col => {
        if (overrides[col.id] !== undefined) {
          col.priceNum = overrides[col.id];
          col.price = formatDT(overrides[col.id]);
        }
      });
    }
    if (c.isMoussePage && Array.isArray(c.types)) {
      c.types.forEach(t => (t.dims || []).forEach(d => {
        if (overrides[d.code] !== undefined) d.prix = overrides[d.code];
      }));
    }
    if (c.isTabkaPage && Array.isArray(c.types)) {
      c.types.forEach(t => (t.thicknesses || []).forEach(th => {
        if (overrides[th.code] !== undefined) th.prix = overrides[th.code];
      }));
    }
    if (c.isRessortPage && Array.isArray(c.types) && Array.isArray(c.sizes)) {
      c.sizes.forEach(s => {
        c.types.forEach((t, ti) => {
          const key = 'ressort::' + t.id + '::' + s.dim;
          if (overrides[key] !== undefined) s.prices[ti] = overrides[key];
        });
      });
    }
  });
}

/* Charge la collection Firestore "price_overrides" -> {key: prix(number)} */
function loadPriceOverrides(db) {
  if (typeof db === 'undefined' || !db) return Promise.resolve({});
  return db.collection('price_overrides').get().then(snap => {
    const map = {};
    snap.forEach(doc => {
      const d = doc.data();
      if (d && typeof d.prix === 'number') map[doc.id] = d.prix;
    });
    return map;
  }).catch(() => ({}));
}

/* Enregistre ou supprime un override de prix pour une clé donnée. */
function savePriceOverride(db, key, newPrice, meta) {
  return db.collection('price_overrides').doc(key).set(Object.assign({
    prix: newPrice, updatedAt: Date.now(),
  }, meta || {}));
}
function deletePriceOverride(db, key) {
  return db.collection('price_overrides').doc(key).delete();
}

if (typeof window !== 'undefined') {
  window.PricingShared = {
    formatDT, parsePriceStr, replaceVariantPrice,
    flattenPriceableItems, applyPriceOverrides,
    loadPriceOverrides, savePriceOverride, deletePriceOverride,
  };
}
