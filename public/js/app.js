// Client app logic — forms aur gallery

const API = '/api';

// Gallery fetch karo
async function loadGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/gallery`);
    if (!res.ok) throw new Error('Failed');
    const items = await res.json();
    if (items.length > 0) {
      renderGallery(grid, items);
    }
  } catch (err) {
    // Default items use karo agar API na chale
  }
}

function renderGallery(container, items) {
  container.innerHTML = items.map((item, i) => `
    <div class="gallery-item reveal-scale">
      <div class="gallery-item-img">
        <img src="${item.image_url}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="gallery-item-overlay">
        <div class="gallery-item-number">${String(i + 1).padStart(2, '0')}</div>
        <div class="gallery-item-title">${item.title}</div>
        <div class="gallery-item-cat">${item.category}</div>
      </div>
    </div>
  `).join('');

  // Naye items ke liye GSAP refresh karo
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => ScrollTrigger.refresh(), 500);
  }
}

// Gallery filter buttons
function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.gallery-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.category;
      items.forEach(item => {
        if (cat === 'ALL' || item.dataset.category === cat) {
          item.style.display = '';
          gsap.fromTo(item, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Booking form handler
function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Bhej rahe hain...';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed');

      const card = form.closest('.form-card');
      card.innerHTML = `
        <div class="form-success">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2 style="font-family: var(--font-display); margin: 1rem 0 0.5rem;">Booking Confirm Ho Gayi!</h2>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            Hum aapse 24 ghante me contact karenge.
          </p>
          <a href="/book" class="btn btn-secondary" style="margin-top: 2rem;">Dusri Booking Karein</a>
        </div>
      `;
    } catch (err) {
      // Offline fallback: local store karo
      const bookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      bookings.push({ ...data, id: Date.now().toString(), status: 'pending', created_at: new Date().toISOString() });
      localStorage.setItem('pendingBookings', JSON.stringify(bookings));

      const card = form.closest('.form-card');
      card.innerHTML = `
        <div class="form-success">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2 style="font-family: var(--font-display); margin: 1rem 0 0.5rem;">Request Save Ho Gayi!</h2>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            Aapki booking save ho gayi hai.
          </p>
          <a href="/" class="btn btn-secondary" style="margin-top: 2rem;">Home Pe Jayein</a>
        </div>
      `;
    }
  });
}

// Contact form handler
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Bhej rahe hain...';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed');

      const card = form.closest('.form-card');
      card.innerHTML = `
        <div class="form-success">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2 style="font-family: var(--font-display); margin: 1rem 0 0.5rem;">Message Send Ho Gaya!</h2>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            Thank you! Hum jaldi aapse contact karenge.
          </p>
          <a href="/" class="btn btn-secondary" style="margin-top: 2rem;">Home Pe Jayein</a>
        </div>
      `;
    } catch (err) {
      btn.textContent = originalText;
      btn.disabled = false;
      alert('Message bhejne me problem aayi. Please dobara try karein.');
    }
  });
}

// Sab initialize karo
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  initGalleryFilters();
  initBookingForm();
  initContactForm();
});
