// Artworks catalog — filter, view toggle aur animations

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('artwork-search');
  const categoryPills = document.querySelectorAll('.category-pill');
  const grid = document.getElementById('artworks-grid');
  const cards = grid ? Array.from(grid.querySelectorAll('.artwork-card')) : [];
  const countEl = document.getElementById('count-number');
  const emptyState = document.getElementById('artworks-empty');
  const viewGridBtn = document.getElementById('view-grid');
  const viewListBtn = document.getElementById('view-list');
  const resetBtn = document.getElementById('reset-filters');

  let activeCategory = 'All';
  let searchQuery = '';

  // Cards filter karo
  function filterCards() {
    let visibleCount = 0;

    cards.forEach(card => {
      const cardCategory = card.dataset.category || '';
      const cardName = card.dataset.name || '';
      const cardDesc = card.dataset.desc || '';
      const cardTags = card.dataset.tags || '';

      const matchesCategory = activeCategory === 'All' || cardCategory === activeCategory;
      const matchesSearch = !searchQuery ||
        cardName.includes(searchQuery) ||
        cardDesc.includes(searchQuery) ||
        cardCategory.toLowerCase().includes(searchQuery) ||
        cardTags.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        visibleCount++;

        // Smooth fade-in
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 50);
      } else {
        card.style.display = 'none';
      }
    });

    // Total count update
    if (countEl) countEl.textContent = visibleCount;

    // Empty state dikhao ya chupao
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
    if (grid) {
      grid.style.display = visibleCount === 0 ? 'none' : '';
    }
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCards();
    });
  }

  // Category switch
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.category;
      filterCards();
    });
  });

  // Filters reset karo
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCategory = 'All';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      categoryPills.forEach(p => p.classList.remove('active'));
      const allPill = document.querySelector('.category-pill[data-category="All"]');
      if (allPill) allPill.classList.add('active');
      filterCards();
    });
  }

  // Grid/List view toggle
  if (viewGridBtn && viewListBtn && grid) {
    viewGridBtn.addEventListener('click', () => {
      grid.classList.remove('artworks-list');
      grid.classList.add('artworks-grid');
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
    });

    viewListBtn.addEventListener('click', () => {
      grid.classList.remove('artworks-grid');
      grid.classList.add('artworks-list');
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
    });
  }
});
