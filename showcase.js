// Vitrine Accueil (bannière promo) — partagé entre dashboard.html (admin) et index.html (affichage)
// Collection Firestore "home_showcase" : { [catId::itemId]: { catId, itemId, type: 'promo'|'nouveaute' } }
(function (global) {

  function flattenShowcaseItems(catalogue, toolCategories) {
    const out = [];
    Object.keys(catalogue || {}).forEach(catId => {
      const cat = catalogue[catId];
      (cat.products || []).forEach(p => {
        out.push({
          key: catId + '::' + p.id,
          catId, catLabel: cat.name || catId,
          itemId: p.id, kind: 'product',
          label: p.name, img: p.img || null,
          price: p.price || null,
        });
      });
    });
    (toolCategories || []).forEach(tc => {
      (tc.items || []).forEach(it => {
        out.push({
          key: 'outils::' + it.code,
          catId: 'outils', catLabel: 'Outils de Tapisserie',
          itemId: it.code, kind: 'tool',
          label: it.name, img: it.img || null,
          price: it.price || null,
        });
      });
    });
    return out;
  }

  function loadShowcaseEntries(db) {
    return db.collection('home_showcase').get().then(snap => {
      const map = {};
      snap.forEach(doc => { map[doc.id] = doc.data(); });
      return map;
    }).catch(() => ({}));
  }

  function saveShowcaseEntry(db, key, data) {
    return db.collection('home_showcase').doc(key).set(Object.assign({ updatedAt: Date.now() }, data), { merge: true });
  }

  function removeShowcaseEntry(db, key) {
    return db.collection('home_showcase').doc(key).delete();
  }

  function findCatalogueItem(catalogue, toolCategories, catId, itemId) {
    if (catId === 'outils') {
      let found = null;
      (toolCategories || []).forEach(tc => {
        const hit = (tc.items || []).find(it => it.code === itemId);
        if (hit) found = Object.assign({}, hit, { catId: 'outils', id: hit.code });
      });
      return found;
    }
    const cat = (catalogue || {})[catId];
    if (!cat) return null;
    const hit = (cat.products || []).find(p => p.id === itemId);
    return hit ? Object.assign({}, hit, { catId }) : null;
  }

  // Fusionne les articles marqués promo:true dans le catalogue avec la sélection admin
  // (home_showcase) pour produire la liste finale affichée dans la bannière d'accueil.
  // Les choix admin passent en premier (la bannière n'affiche que les ~12 premiers items
  // : s'ils arrivaient après les promo:true statiques, un article marqué "Nouveauté"
  // pouvait ne jamais s'afficher faute de place).
  function buildHomeShowcase(catalogue, toolCategories, showcaseMap) {
    const byKey = new Map();

    Object.keys(showcaseMap || {}).forEach(key => {
      const entry = showcaseMap[key];
      if (!entry || !entry.catId || !entry.itemId) return;
      const item = findCatalogueItem(catalogue, toolCategories, entry.catId, entry.itemId);
      if (item) byKey.set(key, Object.assign({}, item, { type: entry.type === 'nouveaute' ? 'nouveaute' : 'promo' }));
    });

    Object.keys(catalogue || {}).forEach(catId => {
      const cat = catalogue[catId];
      (cat.products || []).forEach(p => {
        const key = catId + '::' + p.id;
        if (p.promo && !byKey.has(key)) byKey.set(key, Object.assign({}, p, { catId, type: 'promo' }));
      });
    });
    (toolCategories || []).forEach(tc => {
      (tc.items || []).forEach(it => {
        const key = 'outils::' + it.code;
        if (it.promo && !byKey.has(key)) byKey.set(key, Object.assign({}, it, { catId: 'outils', id: it.code, type: 'promo' }));
      });
    });

    return [...byKey.values()];
  }

  global.ShowcaseShared = {
    flattenShowcaseItems,
    loadShowcaseEntries,
    saveShowcaseEntry,
    removeShowcaseEntry,
    findCatalogueItem,
    buildHomeShowcase,
  };
})(window);
