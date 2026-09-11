// Admin Panel — Homepage marquee gallery (image-only cards, type: homepage_gallery)

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('image-modal');
  const form = document.getElementById('image-form');
  const toast = document.getElementById('admin-toast');
  const formImage = document.getElementById('form-image');
  const formImageUrl = document.getElementById('form-image-url');
  const imagePreview = document.getElementById('image-preview');

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    imagePreview.classList.remove('visible');
    imagePreview.src = '';
  }

  document.getElementById('btn-add-image').addEventListener('click', () => {
    modal.classList.add('active');
  });
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', 'homepage_gallery');

    if (formImage.files[0]) {
      formData.append('image', formImage.files[0]);
    } else if (formImageUrl.value.trim()) {
      formData.append('imageUrl', formImageUrl.value.trim());
    } else {
      showToast('Please choose a file or paste a URL', 'error');
      return;
    }

    try {
      const resp = await fetch('/api/content-cards', { method: 'POST', body: formData });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast('Image added!');
      closeModal();
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this image from the homepage gallery?')) return;
      const id = btn.dataset.id;
      try {
        const resp = await fetch(`/api/content-cards/${id}`, { method: 'DELETE' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);

        showToast('Image removed');
        const tile = btn.closest('.gallery-tile');
        tile.style.transition = 'opacity 0.3s ease';
        tile.style.opacity = '0';
        setTimeout(() => window.location.reload(), 350);
      } catch (err) {
        showToast('Remove failed: ' + err.message, 'error');
      }
    });
  });
});
