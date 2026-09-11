// Admin Panel — Event Gallery (past workshops/camps)

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('event-modal');
  const deleteModal = document.getElementById('delete-modal');
  const form = document.getElementById('event-form');
  const modalTitle = document.getElementById('modal-title');
  const toast = document.getElementById('admin-toast');
  const newPhotosGroup = document.getElementById('new-event-photos-group');

  const formId = document.getElementById('form-id');
  const formName = document.getElementById('form-name');
  const formDate = document.getElementById('form-date');
  const formLocation = document.getElementById('form-location');
  const formDescription = document.getElementById('form-description');
  const formPhotos = document.getElementById('form-photos');

  let deleteId = null;

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function openModal(editMode) {
    modal.classList.add('active');
    modalTitle.textContent = editMode ? 'Edit Event' : 'Add Event';
    newPhotosGroup.style.display = editMode ? 'none' : 'block';
    document.getElementById('modal-submit').innerHTML = editMode
      ? '<i class="fas fa-save"></i> Update'
      : '<i class="fas fa-save"></i> Save';
  }

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    formId.value = '';
  }

  document.getElementById('btn-add-event').addEventListener('click', () => { closeModal(); openModal(false); });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Edit event details
  document.querySelectorAll('.btn-edit-event').forEach((btn) => {
    btn.addEventListener('click', () => {
      formId.value = btn.dataset.id;
      formName.value = btn.dataset.name || '';
      formDate.value = btn.dataset.date || '';
      formLocation.value = btn.dataset.location || '';
      formDescription.value = btn.dataset.description || '';
      openModal(true);
    });
  });

  // Add / edit submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = !!formId.value;
    const url = isEdit ? `/api/events/${formId.value}` : '/api/events';
    const method = isEdit ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('eventName', formName.value);
    formData.append('eventDate', formDate.value);
    formData.append('location', formLocation.value);
    formData.append('description', formDescription.value);

    if (!isEdit && formPhotos.files.length > 0) {
      Array.from(formPhotos.files).forEach((f) => formData.append('photos', f));
    }

    try {
      const resp = await fetch(url, { method, body: formData });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast(isEdit ? 'Event updated!' : 'Event added!');
      closeModal();
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  // Delete event
  document.querySelectorAll('.btn-delete-event').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteId = btn.dataset.id;
      document.getElementById('delete-name').textContent = `"${btn.dataset.name}"`;
      deleteModal.classList.add('active');
    });
  });

  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (!deleteId) return;
    try {
      const resp = await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);

      showToast('Event deleted');
      deleteModal.classList.remove('active');

      const tile = document.querySelector(`.event-tile[data-id="${deleteId}"]`);
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

  // Add more photos to an existing event
  document.querySelectorAll('.btn-add-photos').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = document.querySelector(`.hidden-photo-input[data-id="${id}"]`);
      input.click();
    });
  });

  document.querySelectorAll('.hidden-photo-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const id = input.dataset.id;
      if (!input.files.length) return;

      const formData = new FormData();
      Array.from(input.files).forEach((f) => formData.append('photos', f));

      try {
        const resp = await fetch(`/api/events/${id}`, { method: 'PUT', body: formData });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);

        showToast('Photos added!');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
      }
    });
  });

  // Remove a single photo
  document.querySelectorAll('.remove-photo').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this photo?')) return;
      const id = btn.dataset.id;
      const photoUrl = btn.dataset.url;

      try {
        const resp = await fetch(`/api/events/${id}/remove-photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl }),
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);

        showToast('Photo removed');
        btn.closest('.event-photo').remove();
      } catch (err) {
        showToast('Remove failed: ' + err.message, 'error');
      }
    });
  });
});
