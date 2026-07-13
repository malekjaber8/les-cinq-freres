/* ================================================================
   SYSTÈME PANIER GLOBAL — Les Cinq Frères
   Fonctionne sur toutes les pages du site
   ================================================================ */

const Cart = {

  /* ---------- Lecture / Écriture ---------- */
  get() {
    const items = JSON.parse(localStorage.getItem('5f_cart') || '[]');
    return items.map(item => {
      // Prix à confirmer → forcer priceNum à 0
      if (item.price && /confirmer|devis|appel|–|rouleau/i.test(item.price)) {
        item.priceNum = 0;
        return item;
      }
      // Migration: re-parse priceNum depuis format tunisien "14,000 DT" → 14
      if (item.price && /\d,\d{3}/.test(item.price)) {
        item.priceNum = parseFloat(item.price.replace(/[^\d,]/g,'').replace(',','.')) || item.priceNum;
      }
      return item;
    });
  },
  save(items) {
    localStorage.setItem('5f_cart', JSON.stringify(items));
    Cart.updateBadges();
    Cart.renderDrawerItems();
  },

  /* ---------- Actions ---------- */
  add(product) {
    // product = { productId, catId, name, variant, price, priceNum, qty, note, icon }
    const items = Cart.get();
    // Si même produit + même variante → incrémenter
    const existing = items.find(i => i.productId === product.productId && i.variant === product.variant);
    if (existing) {
      existing.qty += (product.qty || 1);
    } else {
      items.push({
        cartId:    'C' + Date.now() + Math.random().toString(36).slice(2,5),
        productId: product.productId,
        code:      product.code      || product.productId || '',
        catId:     product.catId,
        name:      product.name,
        variant:   product.variant   || '',
        price:     product.price     || 'Sur devis',
        priceNum:  product.priceNum  || 0,
        qty:       product.qty       || 1,
        note:      product.note      || '',
        icon:      product.icon      || '📦',
        addedAt:   new Date().toLocaleDateString('fr-FR'),
      });
    }
    Cart.save(items);
    Cart.showAddFeedback(product.name, product.variant);
  },

  remove(cartId) {
    const items = Cart.get().filter(i => i.cartId !== cartId);
    Cart.save(items);
  },

  updateQty(cartId, qty) {
    const items = Cart.get();
    const item = items.find(i => i.cartId === cartId);
    if (item) item.qty = Math.max(1, qty);
    Cart.save(items);
  },

  clear() {
    localStorage.removeItem('5f_cart');
    Cart.updateBadges();
    Cart.renderDrawerItems();
  },

  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },

  /* ---------- Badge counter sur tous les boutons panier ---------- */
  updateBadges() {
    const n = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = n;
      el.style.display = n > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.cart-count-text').forEach(el => {
      el.textContent = n + ' article' + (n > 1 ? 's' : '');
    });
  },

  /* ---------- Feedback ajout ---------- */
  showAddFeedback(name, variant) {
    // Toast
    if (typeof showToast === 'function') {
      showToast('success', 'Ajouté au panier !', (variant ? variant + ' — ' : '') + name);
    }
    // Anime le bouton panier
    document.querySelectorAll('.cart-trigger-btn').forEach(btn => {
      btn.classList.add('cart-bump');
      setTimeout(() => btn.classList.remove('cart-bump'), 400);
    });
    // Ouvre le drawer automatiquement
    setTimeout(() => Cart.openDrawer(), 300);
  },

  /* ================================================================
     DRAWER (panneau latéral)
     ================================================================ */
  injectDrawer() {
    if (document.getElementById('cartDrawer')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <!-- Overlay -->
      <div id="cartOverlay" onclick="Cart.closeDrawer()" style="display:none;position:fixed;inset:0;background:rgba(18,47,75,.45);z-index:900;backdrop-filter:blur(3px)"></div>

      <!-- Drawer -->
      <aside id="cartDrawer" style="position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:var(--white);z-index:901;display:flex;flex-direction:column;transform:translateX(100%);transition:.35s cubic-bezier(.4,0,.2,1);box-shadow:-8px 0 40px rgba(18,47,75,.18)">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,var(--navy-dark),var(--teal-dark));padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:1.4rem">🛒</span>
            <div>
              <div style="font-family:'Raleway',sans-serif;font-weight:800;font-size:1rem;color:var(--white)">Mon Panier</div>
              <div class="cart-count-text" style="font-size:.75rem;color:rgba(255,255,255,.7)">0 article</div>
            </div>
          </div>
          <button onclick="Cart.closeDrawer()" style="background:rgba(255,255,255,.15);border:none;color:var(--white);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">✕</button>
        </div>

        <!-- Items list -->
        <div id="drawerItems" style="flex:1;overflow-y:auto;padding:16px 20px"></div>

        <!-- Footer -->
        <div id="drawerFooter" style="padding:16px 20px;border-top:1px solid var(--gray-100);flex-shrink:0;background:var(--white)"></div>
      </aside>`;
    document.body.appendChild(div);
    Cart.renderDrawerItems();
  },

  openDrawer() {
    document.getElementById('cartDrawer').style.transform  = 'translateX(0)';
    document.getElementById('cartOverlay').style.display   = 'block';
    Cart.renderDrawerItems();
  },

  closeDrawer() {
    document.getElementById('cartDrawer').style.transform  = 'translateX(100%)';
    document.getElementById('cartOverlay').style.display   = 'none';
  },

  renderDrawerItems() {
    const items = Cart.get();
    const container = document.getElementById('drawerItems');
    const footer    = document.getElementById('drawerFooter');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--gray-400)">
          <div style="font-size:3.5rem;margin-bottom:16px;opacity:.4">🛒</div>
          <div style="font-size:.95rem;font-weight:600;color:var(--gray-600);margin-bottom:6px">Votre panier est vide</div>
          <div style="font-size:.82rem">Explorez notre catalogue pour ajouter des articles.</div>
          <a href="catalogue.html" style="display:inline-block;margin-top:16px;padding:10px 22px;background:linear-gradient(135deg,var(--teal),var(--navy-light));color:var(--white);border-radius:50px;font-size:.85rem;font-weight:600;text-decoration:none">Voir le catalogue</a>
        </div>`;
      footer.innerHTML = '';
      return;
    }

    container.innerHTML = items.map(item => {
      const lineTotal = item.priceNum > 0
        ? (item.priceNum * item.qty).toLocaleString('fr-TN', {minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}) + ' DT'
        : item.price || 'Sur devis';
      const unitLabel = item.priceNum > 0 && item.qty > 1
        ? `<span style="font-size:.72rem;color:var(--gray-400);font-weight:400">${item.price} × ${item.qty}</span>`
        : '';
      return `
      <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--gray-100)" id="drawer-item-${item.cartId}">
        <div style="width:46px;height:46px;background:linear-gradient(135deg,rgba(43,190,200,.12),rgba(27,78,122,.08));border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">${item.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:1px">
            <div style="font-size:.85rem;font-weight:700;color:var(--navy-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
            ${item.code ? `<span style="font-size:.6rem;font-weight:700;color:#94a3b8;background:#f1f5f9;border-radius:4px;padding:1px 5px;white-space:nowrap;flex-shrink:0">${item.code}</span>` : ''}
          </div>
          ${item.variant ? `<div style="font-size:.75rem;color:var(--gray-600);margin-bottom:4px">${item.variant}</div>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div style="display:flex;flex-direction:column;gap:1px">
              <div style="font-size:.85rem;font-weight:700;color:var(--teal-dark)">${lineTotal}</div>
              ${unitLabel}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button onclick="Cart.updateQty('${item.cartId}', ${item.qty - 1})" style="width:24px;height:24px;border:1px solid var(--gray-200);border-radius:6px;background:var(--gray-50);cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;color:var(--gray-800)">−</button>
              <span style="font-size:.85rem;font-weight:700;color:var(--navy-dark);min-width:20px;text-align:center">${item.qty}</span>
              <button onclick="Cart.updateQty('${item.cartId}', ${item.qty + 1})" style="width:24px;height:24px;border:1px solid var(--gray-200);border-radius:6px;background:var(--gray-50);cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;color:var(--gray-800)">+</button>
              <button onclick="Cart.remove('${item.cartId}')" style="width:24px;height:24px;border:none;background:rgba(229,62,62,.08);border-radius:6px;cursor:pointer;font-size:.8rem;color:var(--error)" title="Supprimer">🗑️</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    const GROS_CATS = ['mousse-matelas', 'mousse-tabka', 'ressort'];
    const grosArticle = items.some(i => GROS_CATS.includes(i.catId));
    const LIVRAISON = grosArticle ? 0 : parseFloat(localStorage.getItem('5f_livraison_fee') || '9');
    const subTotal  = items.reduce((s, i) => s + (i.priceNum * i.qty), 0);
    const total     = (!grosArticle && subTotal > 0) ? subTotal + LIVRAISON : 0;
    const livraisonStr = grosArticle ? 'Sur devis' : (LIVRAISON.toLocaleString('fr-TN',{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}) + ' DT');
    footer.innerHTML = `
      <div style="background:var(--gray-50);border-radius:var(--radius);padding:10px 14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;margin-bottom:6px">
          <span style="color:var(--gray-600)">Sous-total</span>
          <span style="font-weight:600;color:var(--gray-800)">${subTotal > 0 ? subTotal.toLocaleString('fr-TN',{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}) + ' DT' : 'Sur devis'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;margin-bottom:8px">
          <span style="color:var(--gray-600)">🚚 Livraison</span>
          <span style="font-weight:600;color:var(--teal-dark)">${livraisonStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--gray-200);padding-top:8px">
          <span style="font-size:.88rem;font-weight:700;color:var(--navy-dark)">Total TTC</span>
          <span style="font-family:'Raleway',sans-serif;font-size:1.15rem;font-weight:800;color:var(--navy-dark)">${(!grosArticle && total > 0) ? total.toLocaleString('fr-TN',{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}) + ' DT' : 'Sur devis'}</span>
        </div>
      </div>
      <a href="panier.html" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:linear-gradient(135deg,var(--teal),var(--navy-light));color:var(--white);border-radius:var(--radius);font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;text-decoration:none;margin-bottom:8px;box-shadow:0 4px 16px rgba(43,190,200,.3)">
        🛒 Voir mon panier & Commander
      </a>
      <button onclick="Cart.clear()" style="width:100%;padding:10px;background:transparent;border:1px solid var(--gray-200);border-radius:var(--radius);font-family:'Poppins',sans-serif;font-size:.82rem;color:var(--gray-600);cursor:pointer">🗑️ Vider le panier</button>`;
  },

  /* ================================================================
     BOUTON FLOTTANT (injecté dans la navbar)
     ================================================================ */
  injectCartBtn() {
    // Cherche les emplacements dans les navbars
    const targets = [
      document.querySelector('.nav-cta'),
      document.querySelector('.cat-nav-right'),
      document.querySelector('.topbar-right'),
    ];
    targets.forEach(target => {
      if (!target || target.querySelector('.cart-trigger-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'cart-trigger-btn';
      btn.onclick = () => Cart.openDrawer();
      btn.setAttribute('title', 'Mon panier');
      btn.style.cssText = 'position:relative;width:40px;height:40px;background:linear-gradient(135deg,var(--teal),var(--navy-light));border:none;border-radius:10px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.3s';
      btn.innerHTML = `🛒<span class="cart-badge" style="display:none;position:absolute;top:-6px;right:-6px;background:#E53E3E;color:#fff;font-size:.62rem;font-weight:800;width:18px;height:18px;border-radius:50%;align-items:center;justify-content:center;border:2px solid #fff;font-family:'Poppins',sans-serif">0</span>`;
      target.prepend(btn);
    });
    Cart.updateBadges();
  },

  /* ---------- Init ---------- */
  init() {
    Cart.injectDrawer();
    Cart.injectCartBtn();
    Cart.updateBadges();
  }
};

/* ---- Style bump animation ---- */
const cartStyle = document.createElement('style');
cartStyle.textContent = `
  @keyframes cartBump { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
  .cart-bump { animation: cartBump .4s ease !important; }
  .cart-trigger-btn:hover { transform:scale(1.05); box-shadow:0 4px 16px rgba(43,190,200,.4); }
`;
document.head.appendChild(cartStyle);

/* ---- Auto-init au chargement ---- */
document.addEventListener('DOMContentLoaded', () => Cart.init());
