/* ================================================================
   GESTION DU STOCK — Les Cinq Frères
   Stockage localStorage | Lecture publique | Écriture admin
   ================================================================ */

const Stock = {

  LS_KEY: '5f_stock',

  /* ── Lire tout le stock ── */
  getAll() {
    try { return JSON.parse(localStorage.getItem(Stock.LS_KEY) || '{}'); }
    catch(e) { return {}; }
  },

  /* ── Lire le stock d'un produit ── */
  get(productId) {
    const all = Stock.getAll();
    return all[productId]; // undefined = jamais défini, number = quantité
  },

  /* ── Enregistrer le stock d'un produit ── */
  set(productId, qty) {
    const all = Stock.getAll();
    all[String(productId)] = parseInt(qty);
    localStorage.setItem(Stock.LS_KEY, JSON.stringify(all));
    Stock.refreshAll();
    if (typeof showToast === 'function') {
      const label = qty === 0 ? 'Rupture de stock' : `${qty} unité${qty > 1 ? 's' : ''}`;
      showToast('success', 'Stock mis à jour', label);
    }
    // Sync Firebase en arrière-plan (sans bloquer)
    if (typeof db !== 'undefined') {
      db.collection('stock').doc(String(productId)).set({
        qty: parseInt(qty),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }
  },

  /* ── Supprimer le statut d'un produit (revenir à N/A) ── */
  remove(productId) {
    const all = Stock.getAll();
    delete all[String(productId)];
    localStorage.setItem(Stock.LS_KEY, JSON.stringify(all));
    Stock.refreshAll();
  },

  /* ── Vérifier si admin ── */
  isAdmin() {
    try {
      const s = JSON.parse(localStorage.getItem('5f_session') || '{}');
      return s.role === 'admin';
    } catch(e) { return false; }
  },

  /* ── Générer le badge HTML ── */
  badge(productId) {
    const qty = Stock.get(productId);
    if (qty === undefined || qty === null) {
      return '<span class="stock-badge stock-none">—</span>';
    }
    if (qty === 0) {
      return '<span class="stock-badge stock-out">Rupture de stock</span>';
    }
    if (qty <= 5) {
      return `<span class="stock-badge stock-low">⚠ Stock faible (${qty})</span>`;
    }
    return `<span class="stock-badge stock-ok">✓ En stock</span>`;
  },

  /* ── Bouton d'édition (admin seulement) ── */
  editBtn(productId) {
    const safeId = String(productId).replace(/'/g, "\\'");
    return `<button class="stock-edit-btn" onclick="event.stopPropagation();Stock.editPrompt('${safeId}')" title="Modifier le stock">✏️</button>`;
  },

  /* ── Popup de modification ── */
  editPrompt(productId) {
    const current = Stock.get(productId);
    const currentLabel = current === undefined ? 'non défini' : current;

    // Créer une mini popup
    let existing = document.getElementById('stock-edit-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'stock-edit-popup';
    popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center';
    popup.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:24px;width:320px;box-shadow:0 8px 40px rgba(0,0,0,.25);font-family:Arial,sans-serif">
        <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#666;margin-bottom:6px">Gestion du stock</div>
        <div style="font-size:.95rem;font-weight:700;color:#1B4E7A;margin-bottom:16px;word-break:break-all">${productId}</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          <button onclick="Stock._setStatus('${productId.replace(/'/g,"\\'")}','ok')"
            style="padding:10px;border:2px solid #a5d6a7;border-radius:8px;background:#e8f5e9;color:#2e7d32;font-weight:700;cursor:pointer;font-size:.88rem">
            ✓ En stock (disponible)
          </button>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="stock-qty-input" type="number" min="1" max="999" placeholder="Quantité limitée…"
              style="flex:1;padding:9px 12px;border:2px solid #ffcc80;border-radius:8px;font-size:.88rem;outline:none">
            <button onclick="Stock._setQty('${productId.replace(/'/g,"\\'")}', document.getElementById('stock-qty-input').value)"
              style="padding:9px 14px;border:2px solid #ffcc80;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:700;cursor:pointer;font-size:.88rem">
              ⚠ Limité
            </button>
          </div>
          <button onclick="Stock._setStatus('${productId.replace(/'/g,"\\'")}','out')"
            style="padding:10px;border:2px solid #ef9a9a;border-radius:8px;background:#ffebee;color:#c62828;font-weight:700;cursor:pointer;font-size:.88rem">
            ✕ Rupture de stock
          </button>
          <button onclick="Stock.remove('${productId.replace(/'/g,"\\'")}');document.getElementById('stock-edit-popup').remove()"
            style="padding:10px;border:2px solid #e0e0e0;border-radius:8px;background:#f5f5f5;color:#666;font-weight:600;cursor:pointer;font-size:.85rem">
            — Supprimer le statut
          </button>
        </div>
        <div style="text-align:right">
          <button onclick="document.getElementById('stock-edit-popup').remove()"
            style="padding:8px 20px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#333;font-weight:600;cursor:pointer;font-size:.85rem">
            Annuler
          </button>
        </div>
      </div>`;
    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  },

  _setStatus(productId, status) {
    if (status === 'ok')  Stock.set(productId, 999);
    if (status === 'out') Stock.set(productId, 0);
    const popup = document.getElementById('stock-edit-popup');
    if (popup) popup.remove();
  },

  _setQty(productId, val) {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) {
      alert('Entrez une quantité valide (≥ 1)');
      return;
    }
    Stock.set(productId, n);
    const popup = document.getElementById('stock-edit-popup');
    if (popup) popup.remove();
  },

  /* ── Mettre à jour tous les badges visibles ── */
  refreshAll() {
    const admin = Stock.isAdmin();
    document.querySelectorAll('[data-stock-id]').forEach(el => {
      const id = el.dataset.stockId;
      el.innerHTML = Stock.badge(id) + (admin ? Stock.editBtn(id) : '');
    });
  },

  /* ── Chargement initial (essaie Firebase puis localStorage) ── */
  async loadAll() {
    if (typeof db !== 'undefined') {
      try {
        const snap = await db.collection('stock').get();
        const all = Stock.getAll();
        snap.forEach(doc => {
          const qty = doc.data().qty;
          if (qty !== undefined) all[doc.id] = qty;
        });
        localStorage.setItem(Stock.LS_KEY, JSON.stringify(all));
      } catch(e) { /* utilise localStorage */ }
    }
    Stock.refreshAll();
  }
};

window.Stock = Stock;
document.addEventListener('DOMContentLoaded', () => Stock.loadAll());
