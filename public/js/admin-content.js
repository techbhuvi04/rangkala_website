// Admin Panel — Services / Workshops content cards + page settings
// Reused by /admin/services and /admin/workshops (window.CONTENT_CARD_TYPE tells which)

document.addEventListener('DOMContentLoaded', () => {
  const TYPE = window.CONTENT_CARD_TYPE; // 'service' | 'workshop'

  const modal = document.getElementById('card-modal');
  const deleteModal = document.getElementById('delete-modal');
  const form = document.getElementById('card-form');
  const modalTitle = document.getElementById('modal-title');
  const toast = document.getElementById('admin-toast');

  const formId = document.getElementById('form-id');
  const formTitle = document.getElementById('form-title');
  const formDescription = document.getElementById('form-description');
  const formCtaText = document.getElementById('form-cta-text');
  const formCtaLink = document.getElementById('form-cta-link');
  const formImage = document.getElementById('form-image');
  const formImageUrl = document.getElementById('form-image-url');
  const imagePreview = document.getElementById('image-preview');

  let deleteId = null;

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function openModal(editMode) {
    modal.classList.add('active');
    modalTitle.textContent = editMode ? 'Edit Card' : 'Add Card';
    document.getElementById('modal-submit').innerHTML = editMode
      ? '<i class="fas fa-save"></i> Update'
      : '<i class="fas fa-save"></i> Save';
  }

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    formId.value = '';
    imagePreview.classList.remove('visible');
    imagePreview.src = '';
  }

  const addBtn = document.getElementById('btn-add-card');
  if (addBtn) addBtn.addEventListener('click', () => { closeModal(); openModal(false); });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  formImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagePreview.src = ev.target.result;
        imagePreview.classList.add('visible');
      };
      reader.readAsDataURL(file);
    }
  });

  formImageUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      imagePreview.src = url;
      imagePreview.classList.add('visible');
    } else {
      imagePreview.classList.remove('visible');
    }
  });

  // Edit card
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      formId.value = btn.dataset.id;
      formTitle.value = btn.dataset.title || '';
      formDescription.value = btn.dataset.description || '';
      formCtaText.value = btn.dataset.ctaText || '';
      formCtaLink.value = btn.dataset.ctaLink || '';

      const img = btn.dataset.image || '';
      formImageUrl.value = img.startsWith('/uploads') ? '' : img;
      if (img) {
        imagePreview.src = img;
        imagePreview.classList.add('visible');
      }

      openModal(true);
    });
  });

  // Delete card
  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteId = btn.dataset.id;
      document.getElementById('delete-name').textContent = `"${btn.dataset.title}"?`;
      deleteModal.classList.add('active');
    });
  });

  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (!deleteId) return;
    try {
      const resp = await fetch(`/api/content-cards/${deleteId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast('Card deleted');
      deleteModal.classList.remove('active');

      const tile = document.querySelector(`.card-tile[data-id="${deleteId}"]`);
      if (tile) {
        tile.style.transition = 'opacity 0.3s ease';
        tile.style.opacity = '0';
        setTimeout(() => tile.remove(), 300);
      }
      deleteId = null;
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  });

  // Add / edit submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit = !!formId.value;
    const url = isEdit ? `/api/content-cards/${formId.value}` : '/api/content-cards';
    const method = isEdit ? 'PUT' : 'POST';

    const formData = new FormData();
    if (!isEdit) formData.append('type', TYPE);
    formData.append('title', formTitle.value);
    formData.append('description', formDescription.value);
    formData.append('ctaText', formCtaText.value);
    formData.append('ctaLink', formCtaLink.value);

    if (formImage.files[0]) {
      formData.append('image', formImage.files[0]);
    } else if (formImageUrl.value.trim()) {
      formData.append('imageUrl', formImageUrl.value.trim());
    }

    try {
      const resp = await fetch(url, { method, body: formData });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast(isEdit ? 'Card updated!' : 'Card added!');
      closeModal();
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  // Page header / stats settings form
  const pageForm = document.getElementById('page-settings-form');
  if (pageForm) {
    pageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = TYPE === 'service' ? 'services_page' : 'workshops_page';
      const data = Object.fromEntries(new FormData(pageForm));
      try {
        const resp = await fetch(`/api/page-content/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await resp.json();
        if (!result.success) throw new Error(result.message);
        showToast('Page settings saved!');
      } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
      }
    });
  }
});
