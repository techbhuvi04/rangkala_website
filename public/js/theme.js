// Theme manager — dark/light toggle

const STORAGE_KEY = 'rangkala-theme';

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const body = document.body;
  
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    updateParticleTheme('light');
  }

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      const isLight = body.classList.contains('light-mode');
      const theme = isLight ? 'light' : 'dark';
      
      localStorage.setItem(STORAGE_KEY, theme);
      updateParticleTheme(theme);

      // Icon animation
      const icon = toggle.querySelector('i:visible') || toggle.querySelector('i');
      gsap.fromTo(toggle, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    });
  }
}

function updateParticleTheme(theme) {
  // Particles ko event bhejo
  const event = new CustomEvent('themeChanged', { detail: { theme } });
  window.dispatchEvent(event);
}

document.addEventListener('DOMContentLoaded', initTheme);
