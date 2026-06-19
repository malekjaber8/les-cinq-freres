// =============================================
// Global Utilities — Les Cinq Frères
// =============================================

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
