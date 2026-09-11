// Admin Panel — Testimonials (homepage + workshops)

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('t-modal');
  const form = document.getElementById('t-form');
  const modalTitle = document.getElementById('modal-title');
  const toast = document.getElementById('admin-toast');

  const formId = document.getElementById('form-id');
  const formCategory = document.getElementById('form-category');
  const formName = document.getElementById('form-name');
  const formRole = document.getElementById('form-role');
  const formQuote = document.getElementById('form-quote');
  const formRating = document.getElementById('form-rating');

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function openModal(editMode, category) {
    modal.classList.add('active');
    modalTitle.textContent = editMode ? 'Edit Testimonial' : 'Add Testimonial';
    formCategory.value = category;
  }

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    formId.value = '';
  }

  document.querySelectorAll('.btn-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal();
      openModal(false, btn.dataset.category);
    });
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      formId.value = btn.dataset.id;
      formName.value = btn.dataset.name || '';
      formRole.value = btn.dataset.role || '';
      formQuote.value = btn.dataset.quote || '';
      formRating.value = btn.dataset.rating || '5';
      openModal(true, btn.dataset.category);
    });
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this testimonial?')) return;
      const id = btn.dataset.id;
      try {
        const resp = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);

        showToast('Testimonial deleted');
        const tile = btn.closest('.t-tile');
        tile.style.transition = 'opacity 0.3s ease';
        tile.style.opacity = '0';
        setTimeout(() => tile.remove(), 300);
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = !!formId.value;
    const url = isEdit ? `/api/testimonials/${formId.value}` : '/api/testimonials';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      name: formName.value,
      role: formRole.value,
      quote: formQuote.value,
      rating: formRating.value,
    };
    if (!isEdit) payload.category = formCategory.value;

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast(isEdit ? 'Testimonial updated!' : 'Testimonial added!');
      closeModal();
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
});
