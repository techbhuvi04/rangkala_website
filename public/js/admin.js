// Admin Panel — Artwork management

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('artwork-modal');
  const deleteModal = document.getElementById('delete-modal');
  const form = document.getElementById('artwork-form');
  const modalTitle = document.getElementById('modal-title');
  const toast = document.getElementById('admin-toast');

  // Form inputs
  const formId = document.getElementById('form-id');
  const formName = document.getElementById('form-name');
  const formCategory = document.getElementById('form-category');
  const formDescription = document.getElementById('form-description');
  const formMedium = document.getElementById('form-medium');
  const formDimensions = document.getElementById('form-dimensions');
  const formPrice = document.getElementById('form-price');
  const formTags = document.getElementById('form-tags');
  const formImage = document.getElementById('form-image');
  const formImageUrl = document.getElementById('form-image-url');
  const formAvailable = document.getElementById('form-available');
  const imagePreview = document.getElementById('image-preview');

  let deleteId = null;

  // Toast notification
  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // Modal open/close helpers
  function openModal(editMode = false) {
    modal.classList.add('active');
    modalTitle.textContent = editMode ? 'Edit Artwork' : 'Naya Artwork Add Karein';
    document.getElementById('modal-submit').innerHTML = editMode
      ? '<i class="fas fa-save"></i> Update Artwork'
      : '<i class="fas fa-save"></i> Save Artwork';
  }

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    formId.value = '';
    imagePreview.classList.remove('visible');
    imagePreview.src = '';
  }

  // Naya add karne ka button
  document.getElementById('btn-add-artwork').addEventListener('click', () => {
    closeModal();
    openModal(false);
  });

  // Modal band karo
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  // Overlay click pe band karo
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Image preview handle karo
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

  // Edit artwork click
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const resp = await fetch(`/api/artworks/${id}`);
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);

        const art = data.artwork;
        formId.value = art.id;
        formName.value = art.name;
        formCategory.value = art.category;
        formDescription.value = art.description;
        formMedium.value = art.medium;
        formDimensions.value = art.dimensions;
        formPrice.value = art.price;
        formTags.value = art.tags ? art.tags.join(', ') : '';
        formAvailable.checked = art.available;
        formImageUrl.value = art.image.startsWith('/uploads') ? '' : art.image;

        if (art.image) {
          imagePreview.src = art.image;
          imagePreview.classList.add('visible');
        }

        openModal(true);
      } catch (err) {
        showToast('Artwork load nahi hua: ' + err.message, 'error');
      }
    });
  });

  // Delete modal open
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteId = btn.dataset.id;
      document.getElementById('delete-name').textContent = `"${btn.dataset.name}"?`;
      deleteModal.classList.add('active');
    });
  });

  // Delete confirm action
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (!deleteId) return;
    try {
      const resp = await fetch(`/api/artworks/${deleteId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast('Artwork delete ho gaya');
      deleteModal.classList.remove('active');

      // Row table se hatao
      const row = document.querySelector(`tr[data-id="${deleteId}"]`);
      if (row) {
        row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => row.remove(), 300);
      }

      deleteId = null;
    } catch (err) {
      showToast('Delete fail: ' + err.message, 'error');
    }
  });

  // Form submit karo (create / update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit = !!formId.value;
    const url = isEdit ? `/api/artworks/${formId.value}` : '/api/artworks';
    const method = isEdit ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('name', formName.value);
    formData.append('category', formCategory.value);
    formData.append('description', formDescription.value);
    formData.append('medium', formMedium.value);
    formData.append('dimensions', formDimensions.value);
    formData.append('price', formPrice.value);
    formData.append('tags', formTags.value);
    formData.append('available', formAvailable.checked);

    if (formImage.files[0]) {
      formData.append('image', formImage.files[0]);
    } else if (formImageUrl.value.trim()) {
      formData.append('imageUrl', formImageUrl.value.trim());
    }

    try {
      const resp = await fetch(url, { method, body: formData });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast(isEdit ? 'Artwork update ho gaya!' : 'Artwork save ho gaya!');
      closeModal();

      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  // Table search
  const adminSearch = document.getElementById('admin-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#admin-table-body tr').forEach(row => {
        const name = row.dataset.name || '';
        row.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }
});
