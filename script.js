// =============================================
// Global Utilities — Les Cinq Frères
// =============================================

// Bouton flottant Visite Virtuelle 360° — injecté sur toutes les pages
(function() {
  const css = `
    #fab360{position:fixed;bottom:160px;right:20px;z-index:801;text-decoration:none;animation:float360 3s ease-in-out infinite}
    #fab360-inner{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0f2d4a,#1A99A3);color:#fff;padding:13px 20px;border-radius:50px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:700;box-shadow:0 6px 24px rgba(43,190,200,.5);position:relative;transition:transform .2s;white-space:nowrap}
    #fab360-inner::before{content:'';position:absolute;inset:-3px;border-radius:50px;background:linear-gradient(135deg,#2BBEC8,#fff,#1A99A3);z-index:-1;animation:borderSpin 3s linear infinite;opacity:.6}
    #fab360-badge{background:#fff;color:#1A99A3;font-size:.7rem;font-weight:900;padding:2px 7px;border-radius:50px;letter-spacing:.04em}
    #fab360:hover #fab360-inner{transform:scale(1.06)}
    @keyframes float360{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes borderSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @media(max-width:600px){#fab360{bottom:130px;right:12px}#fab360-inner{padding:11px 14px;font-size:.78rem;gap:7px}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('a');
  btn.href = 'https://maps.app.goo.gl/TuoCRxmvoeTPbegA9';
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.id = 'fab360';
  btn.title = 'Visite Virtuelle 360°';
  btn.innerHTML = '<div id="fab360-inner"><span style="font-size:1.3rem">🔭</span><span>Visite <strong>360°</strong></span><span id="fab360-badge">LIVE</span></div>';
  document.body.appendChild(btn);
})();

// Toggle password visibility
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// Password strength checker
function checkStrength(val) {
  const bars = [document.getElementById('s1'), document.getElementById('s2'),
                document.getElementById('s3'), document.getElementById('s4')];
  const label = document.getElementById('strengthLabel');
  if (!bars[0]) return;

  const colors = { 1: '#E53E3E', 2: '#DD6B20', 3: '#D69E2E', 4: '#38A169' };
  const labels = { 0: 'Entrez un mot de passe', 1: 'Très faible', 2: 'Faible', 3: 'Moyen', 4: 'Fort ✅' };

  let score = 0;
  if (val.length >= 8)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  bars.forEach((b, i) => {
    b.style.background = i < score ? colors[score] : 'var(--gray-200)';
  });
  label.textContent = labels[score] || labels[0];
  label.style.color = colors[score] || 'var(--gray-600)';
}

// Toast notification system
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="t-icon">${icons[type] || 'ℹ️'}</span>
    <div class="t-text">
      <strong>${title}</strong>
      ${message ? `<span>${message}</span>` : ''}
    </div>
    <span class="t-close" onclick="this.closest('.toast').remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Animate elements on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .why-card, .feature-item, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
});
