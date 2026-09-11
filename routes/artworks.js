const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
  createArtwork,
  getAllArtworks,
  getArtwork,
  updateArtwork,
  deleteArtwork,
  getFirestore,
  createBooking,
  getAllBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
  createContentCard,
  getContentCards,
  getContentCard,
  updateContentCard,
  deleteContentCard,
  reorderContentCards,
  getPageContent,
  savePageContent,
  createEventEntry,
  getAllEventEntries,
  getEventEntry,
  updateEventEntry,
  deleteEventEntry,
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../lib/firebase');
const {
  sendBookingStatusEmail,
  sendNewBookingAdminAlert,
} = require('../lib/mailer');
const bookingToken = require('../lib/booking-token');

// Defaults — Firestore me kuch na ho to yeh dikhega
const SERVICES_PAGE_DEFAULTS = {
  label: 'WHAT WE OFFER',
  title: 'Our Services',
  subtitle: 'Professional hand-painted artwork for every space and occasion',
  ctaTitle: 'Have a Project in Mind?',
  ctaSubtitle: 'Let us help you bring your artistic vision to life',
};

const WORKSHOPS_PAGE_DEFAULTS = {
  label: 'WORKSHOPS & EVENTS',
  title: 'Bring Art To Your Campus',
  subtitle:
    'We organize hands-on art & craft workshops, summer camps, and creative events for schools, colleges, and organizations — book us for your next event',
  statWorkshops: '50+',
  statStudents: '5000+',
  statInstitutions: '30+',
  statYears: '8+',
};

// Shared: booking ka status set karo + customer ko notify karo.
// Admin portal aur one-click email link dono isi ko call karte hain.
async function applyBookingStatus(id, status) {
  const allowed = ['pending', 'confirmed', 'done', 'cancelled'];
  if (!allowed.includes(status)) {
    const e = new Error('Invalid status');
    e.statusCode = 400;
    throw e;
  }

  const updated = await updateBookingStatus(id, status);

  let email = { sent: false, reason: 'not-notifiable' };
  if (status === 'confirmed' || status === 'cancelled') {
    try {
      const booking = await getBooking(id);
      email = await sendBookingStatusEmail(booking, status);
    } catch (mailErr) {
      console.warn('Booking status email skipped:', mailErr.message);
      email = { sent: false, reason: mailErr.message };
    }
  }

  return { updated, email };
}
const {
  upload,
  uploadErrorHandler,
  handleImageUpload,
} = require('../lib/image-upload');

// Admin login check karo
const adminAuth = (req, res, next) => {
  if (req.cookies.admin_auth === 'gym_auth_token') {
    next();
  } else {
    // API request pe 401 do
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    // Baaki pe login page bhejo
    res.redirect('/admin/login');
  }
};

// Slug generate helper
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Random ID helper
function generateId() {
  return 'art' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// API: Saare artworks fetch karo
router.get('/api/artworks', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filters = {};
    
    if (category && category !== 'All') {
      filters.category = category;
    }
    
    if (search) {
      filters.search = search;
    }

    const artworks = await getAllArtworks(filters);
    res.json({ success: true, artworks, total: artworks.length });
  } catch (err) {
    console.error('API artworks error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Single artwork nikalo
router.get('/api/artworks/:id', async (req, res) => {
  try {
    const artwork = await getArtwork(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork nahi mila' });
    }
    res.json({ success: true, artwork });
  } catch (err) {
    console.error('API single artwork error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Naya artwork banao
router.post('/api/artworks', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, medium, dimensions, price, available, tags } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name aur category zaroori hai' });
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
    }

    // Image upload handle karo
    const imageUrl = await handleImageUpload(req.file, req.body.imageUrl || '');

    const artworkData = {
      id: generateId(),
      name,
      slug: generateSlug(name),
      category,
      description: description || '',
      image: imageUrl,
      medium: medium || '',
      dimensions: dimensions || '',
      price: price || '',
      available: available === 'true' || available === true,
      featured: false,
      tags: parsedTags,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const newArtwork = await createArtwork(artworkData);
    res.json({ success: true, artwork: newArtwork });
  } catch (err) {
    console.error('Create artwork error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Artwork update karo
router.put('/api/artworks/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const artwork = await getArtwork(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork nahi mila' });
    }

    const { name, category, description, medium, dimensions, price, available, featured, tags } = req.body;

    const updateData = { ...artwork };

    if (name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (medium !== undefined) updateData.medium = medium;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (price !== undefined) updateData.price = price;
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    
    if (tags !== undefined) {
      updateData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }

    // Nayi image aayi to upload karo
    if (req.file || req.body.imageUrl) {
      const imageUrl = await handleImageUpload(req.file, req.body.imageUrl || '');
      if (imageUrl) {
        updateData.image = imageUrl;
      }
    }

    const updated = await updateArtwork(artwork.id, updateData);
    res.json({ success: true, artwork: updated });
  } catch (err) {
    console.error('Update artwork error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Artwork delete karo
router.delete('/api/artworks/:id', adminAuth, async (req, res) => {
  try {
    const artwork = await getArtwork(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork nahi mila' });
    }

    // Local image delete karo agar upload hui thi
    if (artwork.image && artwork.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', 'public', artwork.image);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.warn('Image delete fail:', e.message);
        }
      }
    }

    await deleteArtwork(artwork.id);
    res.json({ success: true, message: 'Artwork delete ho gaya' });
  } catch (err) {
    console.error('Delete artwork error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Page: Artworks gallery page
router.get('/artworks', async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.render('artworks', {
        title: 'Artworks — RangKala Creations',
        artworks: [],
        categories: [],
        error: `Database connect nahi hua. ${res.locals.dbError || ''}`
      });
    }

    const artworks = await getAllArtworks();
    const categories = ['All', ...new Set(artworks.map(a => a.category))];
    res.render('artworks', {
      title: 'Artworks — RangKala Creations',
      artworks,
      categories
    });
  } catch (err) {
    console.error('Artworks load error:', err.message);
    res.render('artworks', {
      title: 'Artworks — RangKala Creations',
      artworks: [],
      categories: [],
      error: `DB Error: ${err.message}`
    });
  }
});

// Page: Artwork detail page
router.get('/artworks/:slug', async (req, res) => {
  try {
    const artwork = await getArtwork(req.params.slug);
    if (!artwork) {
      const all = await getAllArtworks();
      return res.status(404).render('artworks', {
        title: 'Not Found — RangKala Creations',
        artworks: all,
        categories: ['All', ...new Set(all.map(a => a.category))]
      });
    }

    // Related artworks uthao
    const allArtworks = await getAllArtworks({ category: artwork.category });
    const related = allArtworks.filter(a => a.id !== artwork.id).slice(0, 3);

    res.render('artwork-detail', {
      title: `${artwork.name} — RangKala Creations`,
      artwork,
      related
    });
  } catch (err) {
    console.error('Artwork detail error:', err.message);
    res.status(500).send('Database Error');
  }
});

// Admin login page
router.get('/admin/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login' });
});

router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'gym') {
    res.cookie('admin_auth', 'gym_auth_token', { httpOnly: true });
    res.redirect('/admin/artworks');
  } else {
    res.render('admin/login', { title: 'Admin Login', error: 'Galat password' });
  }
});

router.get('/admin/logout', (req, res) => {
  res.clearCookie('admin_auth');
  res.redirect('/admin/login');
});

// Admin panel dashboard
router.get('/admin/artworks', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.render('admin/artworks', {
        title: 'Admin — Manage Artworks',
        artworks: [],
        categories: [],
        error: `Database ready nahi hai. ${res.locals.dbError || ''}`
      });
    }

    const artworks = await getAllArtworks();
    const categories = [...new Set(artworks.map(a => a.category))];
    res.render('admin/artworks', {
      title: 'Admin — Manage Artworks',
      artworks,
      categories
    });
  } catch (err) {
    console.error('Admin artworks error:', err.message);
    res.render('admin/artworks', {
      title: 'Admin — Manage Artworks',
      artworks: [],
      categories: [],
      error: `DB Error: ${err.message}`
    });
  }
});

// ---- Bookings ----

// API: Public booking submit karo
router.post('/api/bookings', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      preferred_date,
      address,
      message,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name aur phone zaroori hai' });
    }

    const booking = await createBooking({
      name,
      email: email || '',
      phone,
      service: service || '',
      preferredDate: preferred_date || '',
      address: address || '',
      message: message || '',
      status: 'pending',
    });

    // Admin ko alert bhejo — fire-and-forget
    sendNewBookingAdminAlert(booking).catch((e) =>
      console.warn('Admin alert skipped:', e.message)
    );

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Contact form submit karo (General Enquiry — bookings me hi save hota hai)
router.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Name aur message zaroori hai' });
    }

    const booking = await createBooking({
      name,
      email: email || '',
      phone: phone || '',
      service: 'General Enquiry',
      preferredDate: '',
      address: '',
      message,
      status: 'pending',
    });

    // Admin ko alert bhejo — fire-and-forget
    sendNewBookingAdminAlert(booking).catch((e) =>
      console.warn('Admin alert skipped:', e.message)
    );

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Create contact enquiry error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Booking status update (admin portal)
router.put('/api/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { updated, email } = await applyBookingStatus(req.params.id, req.body.status);
    res.json({ success: true, booking: updated, email });
  } catch (err) {
    console.error('Update booking error:', err.message);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// One-click confirm/cancel from the admin alert email (token-gated, no login)
router.get('/booking-action/:id/:action', async (req, res) => {
  const { id, action } = req.params;
  const map = { confirm: 'confirmed', cancel: 'cancelled' };
  const status = map[action];

  const render = (ok, heading, detail) =>
    res.status(ok ? 200 : 400).render('booking-action', {
      title: ok ? 'Done' : 'Action failed',
      ok,
      heading,
      detail,
    });

  if (!status) {
    return render(false, 'Unknown action', 'That link is not valid.');
  }
  if (!bookingToken.verify(id, action, req.query.token)) {
    return render(false, 'Invalid or expired link', 'This confirmation link could not be verified.');
  }

  try {
    const existing = await getBooking(id);
    if (!existing) {
      return render(false, 'Booking not found', 'It may have already been deleted.');
    }
    if (existing.status === status) {
      return render(true, `Already ${status}`, `This booking was already marked ${status}. No email re-sent.`);
    }

    const { email } = await applyBookingStatus(id, status);
    const note =
      email.sent
        ? `The customer has been emailed.`
        : `Status updated. Customer email not sent (${email.reason}).`;
    return render(true, `Booking ${status}`, `${existing.name}'s booking is now ${status}. ${note}`);
  } catch (err) {
    console.error('Booking action error:', err.message);
    return render(false, 'Something went wrong', err.message);
  }
});

// API: Booking delete (admin)
router.delete('/api/bookings/:id', adminAuth, async (req, res) => {
  try {
    await deleteBooking(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete booking error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin panel: Bookings list
router.get('/admin/bookings', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.render('admin/bookings', {
        title: 'Admin — Bookings',
        bookings: [],
        error: `Database ready nahi hai. ${res.locals.dbError || ''}`,
      });
    }

    const bookings = await getAllBookings();
    res.render('admin/bookings', { title: 'Admin — Bookings', bookings });
  } catch (err) {
    console.error('Admin bookings error:', err.message);
    res.render('admin/bookings', {
      title: 'Admin — Bookings',
      bookings: [],
      error: `DB Error: ${err.message}`,
    });
  }
});

// ---- Homepage ----

// Fallback agar admin ne abhi koi gallery image add nahi ki
const HOMEPAGE_GALLERY_DEFAULTS = [
  { image: 'https://framerusercontent.com/images/1jL7Vm25gXeXyUx89JRQS1fj1jA.webp' },
  { image: 'https://framerusercontent.com/images/FqalmNJZd5zZeeVDdU8m9LOp8MM.webp' },
  { image: 'https://framerusercontent.com/images/PmqxxmH41Ed3VN5mnWWRxs.jpg' },
  { image: 'https://framerusercontent.com/images/JRpIltZLY3x5pIUUDPpl5Q4gYNo.webp' },
  { image: 'https://framerusercontent.com/images/Q1TrExO9DcAhIC58FTZCzZnjH0.jpg' },
  { image: 'https://framerusercontent.com/images/wSwcWIQZjb1coeyXnU7M4Eio.webp' },
];

router.get('/', async (req, res) => {
  try {
    const [cards, testimonials] = await Promise.all([
      getContentCards('homepage_gallery'),
      getTestimonials('homepage'),
    ]);
    const galleryImages = cards.length > 0 ? cards : HOMEPAGE_GALLERY_DEFAULTS;
    res.render('index', { title: 'RangKala Creations', galleryImages, testimonials });
  } catch (err) {
    console.error('Homepage error:', err.message);
    res.render('index', {
      title: 'RangKala Creations',
      galleryImages: HOMEPAGE_GALLERY_DEFAULTS,
      testimonials: [],
    });
  }
});

// ---- Services & Workshops (public pages) ----

router.get('/services', async (req, res) => {
  try {
    const [page, cards] = await Promise.all([
      getPageContent('services_page', SERVICES_PAGE_DEFAULTS),
      getContentCards('service'),
    ]);
    res.render('services', { title: 'Services — RangKala Creations', page, cards });
  } catch (err) {
    console.error('Services page error:', err.message);
    res.render('services', {
      title: 'Services — RangKala Creations',
      page: SERVICES_PAGE_DEFAULTS,
      cards: [],
    });
  }
});

router.get('/portfolio', async (req, res) => {
  try {
    const [page, cards, testimonials] = await Promise.all([
      getPageContent('workshops_page', WORKSHOPS_PAGE_DEFAULTS),
      getContentCards('workshop'),
      getTestimonials('workshop'),
    ]);
    res.render('portfolio', {
      title: 'Workshops & Events — RangKala Creations',
      page,
      cards,
      testimonials,
    });
  } catch (err) {
    console.error('Workshops page error:', err.message);
    res.render('portfolio', {
      title: 'Workshops & Events — RangKala Creations',
      page: WORKSHOPS_PAGE_DEFAULTS,
      cards: [],
      testimonials: [],
    });
  }
});

// ---- Content cards admin API (Services / Workshops cards) ----

const CONTENT_CARD_TYPES = ['service', 'workshop', 'homepage_gallery'];
// Gallery images-only card type: title/description/CTA not required
const TITLE_OPTIONAL_TYPES = ['homepage_gallery'];

router.get('/api/content-cards', adminAuth, async (req, res) => {
  try {
    const type = req.query.type;
    if (!CONTENT_CARD_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    const cards = await getContentCards(type);
    res.json({ success: true, cards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/api/content-cards', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { type, title, description, ctaText, ctaLink } = req.body;
    if (!CONTENT_CARD_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    if (!TITLE_OPTIONAL_TYPES.includes(type) && !title) {
      return res.status(400).json({ success: false, message: 'Title zaroori hai' });
    }
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image zaroori hai' });
    }

    const image = await handleImageUpload(req.file, req.body.imageUrl || '');

    const card = await createContentCard(type, {
      title: title || '',
      description: description || '',
      image: image || '',
      ctaText: ctaText || '',
      ctaLink: ctaLink || '',
    });

    res.json({ success: true, card });
  } catch (err) {
    console.error('Create content card error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/api/content-cards/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const existing = await getContentCard(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Card nahi mila' });
    }

    const { title, description, ctaText, ctaLink } = req.body;
    const updateData = {
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      ctaText: ctaText !== undefined ? ctaText : existing.ctaText,
      ctaLink: ctaLink !== undefined ? ctaLink : existing.ctaLink,
    };

    if (req.file || req.body.imageUrl) {
      updateData.image = await handleImageUpload(req.file, req.body.imageUrl || existing.image);
    }

    const card = await updateContentCard(req.params.id, updateData);
    res.json({ success: true, card });
  } catch (err) {
    console.error('Update content card error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/api/content-cards/:id', adminAuth, async (req, res) => {
  try {
    const existing = await getContentCard(req.params.id);
    if (existing && existing.image && existing.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.warn('Image delete fail:', e.message);
        }
      }
    }
    await deleteContentCard(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/api/content-cards-reorder', adminAuth, async (req, res) => {
  try {
    const { updates } = req.body; // [{id, order}, ...]
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'updates array zaroori hai' });
    }
    await reorderContentCards(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Page content admin API (headers / stats) ----

router.put('/api/page-content/:key', adminAuth, async (req, res) => {
  try {
    const allowedKeys = ['services_page', 'workshops_page'];
    if (!allowedKeys.includes(req.params.key)) {
      return res.status(400).json({ success: false, message: 'Invalid page key' });
    }
    const saved = await savePageContent(req.params.key, req.body);
    res.json({ success: true, page: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Testimonials admin API ----

const TESTIMONIAL_CATEGORIES = ['homepage', 'workshop'];

router.get('/api/testimonials', adminAuth, async (req, res) => {
  try {
    const category = req.query.category;
    if (!TESTIMONIAL_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    const items = await getTestimonials(category);
    res.json({ success: true, testimonials: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/api/testimonials', adminAuth, async (req, res) => {
  try {
    const { category, name, quote, rating, role } = req.body;
    if (!TESTIMONIAL_CATEGORIES.includes(category) || !name || !quote) {
      return res.status(400).json({ success: false, message: 'Category, name aur quote zaroori hai' });
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    const testimonial = await createTestimonial(category, {
      name,
      quote,
      rating: ratingNum,
      role: role || '',
    });

    res.json({ success: true, testimonial });
  } catch (err) {
    console.error('Create testimonial error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/api/testimonials/:id', adminAuth, async (req, res) => {
  try {
    const existing = await getTestimonial(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial nahi mila' });
    }

    const { name, quote, rating, role } = req.body;
    const updateData = {
      name: name !== undefined ? name : existing.name,
      quote: quote !== undefined ? quote : existing.quote,
      role: role !== undefined ? role : existing.role,
    };
    if (rating !== undefined) {
      updateData.rating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    }

    const testimonial = await updateTestimonial(req.params.id, updateData);
    res.json({ success: true, testimonial });
  } catch (err) {
    console.error('Update testimonial error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/api/testimonials/:id', adminAuth, async (req, res) => {
  try {
    await deleteTestimonial(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Admin panel pages ----

router.get('/admin/testimonials', adminAuth, async (req, res) => {
  try {
    const [homepage, workshop] = await Promise.all([
      getTestimonials('homepage'),
      getTestimonials('workshop'),
    ]);
    res.render('admin/testimonials', {
      title: 'Admin — Testimonials',
      homepageTestimonials: homepage,
      workshopTestimonials: workshop,
    });
  } catch (err) {
    console.error('Admin testimonials error:', err.message);
    res.render('admin/testimonials', {
      title: 'Admin — Testimonials',
      homepageTestimonials: [],
      workshopTestimonials: [],
      error: `DB Error: ${err.message}`,
    });
  }
});

router.get('/admin/homepage-gallery', adminAuth, async (req, res) => {
  try {
    const images = await getContentCards('homepage_gallery');
    res.render('admin/homepage-gallery', { title: 'Admin — Homepage Gallery', images });
  } catch (err) {
    console.error('Admin homepage-gallery error:', err.message);
    res.render('admin/homepage-gallery', {
      title: 'Admin — Homepage Gallery',
      images: [],
      error: `DB Error: ${err.message}`,
    });
  }
});

router.get('/admin/services', adminAuth, async (req, res) => {
  try {
    const [page, cards] = await Promise.all([
      getPageContent('services_page', SERVICES_PAGE_DEFAULTS),
      getContentCards('service'),
    ]);
    res.render('admin/services', { title: 'Admin — Services', page, cards, type: 'service' });
  } catch (err) {
    console.error('Admin services error:', err.message);
    res.render('admin/services', {
      title: 'Admin — Services',
      page: SERVICES_PAGE_DEFAULTS,
      cards: [],
      type: 'service',
      error: `DB Error: ${err.message}`,
    });
  }
});

router.get('/admin/workshops', adminAuth, async (req, res) => {
  try {
    const [page, cards] = await Promise.all([
      getPageContent('workshops_page', WORKSHOPS_PAGE_DEFAULTS),
      getContentCards('workshop'),
    ]);
    res.render('admin/workshops', { title: 'Admin — Workshops', page, cards, type: 'workshop' });
  } catch (err) {
    console.error('Admin workshops error:', err.message);
    res.render('admin/workshops', {
      title: 'Admin — Workshops',
      page: WORKSHOPS_PAGE_DEFAULTS,
      cards: [],
      type: 'workshop',
      error: `DB Error: ${err.message}`,
    });
  }
});

// ---- Event gallery (past workshops / camps) ----

// Public: gallery page
router.get('/events-gallery', async (req, res) => {
  try {
    const events = await getAllEventEntries();
    res.render('events-gallery', { title: 'Past Events — RangKala Creations', events });
  } catch (err) {
    console.error('Events gallery error:', err.message);
    res.render('events-gallery', { title: 'Past Events — RangKala Creations', events: [] });
  }
});

// Admin API: list
router.get('/api/events', adminAuth, async (req, res) => {
  try {
    const events = await getAllEventEntries();
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin API: create (multiple photos)
router.post('/api/events', adminAuth, upload.array('photos', 12), async (req, res) => {
  try {
    const { eventName, eventDate, location, description } = req.body;
    if (!eventName) {
      return res.status(400).json({ success: false, message: 'Event name zaroori hai' });
    }

    const files = req.files || [];
    const photos = [];
    for (const file of files) {
      const url = await handleImageUpload(file, '');
      if (url) photos.push(url);
    }

    // Extra photo URLs (comma separated) bhi support karo
    if (req.body.photoUrls) {
      req.body.photoUrls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
        .forEach((u) => photos.push(u));
    }

    const event = await createEventEntry({
      eventName,
      eventDate: eventDate || '',
      location: location || '',
      description: description || '',
      photos,
    });

    res.json({ success: true, event });
  } catch (err) {
    console.error('Create event error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin API: update (details, and optionally add more photos)
router.put('/api/events/:id', adminAuth, upload.array('photos', 12), async (req, res) => {
  try {
    const existing = await getEventEntry(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event nahi mila' });
    }

    const { eventName, eventDate, location, description } = req.body;
    const updateData = {
      eventName: eventName || existing.eventName,
      eventDate: eventDate !== undefined ? eventDate : existing.eventDate,
      location: location !== undefined ? location : existing.location,
      description: description !== undefined ? description : existing.description,
    };

    const files = req.files || [];
    if (files.length > 0) {
      const newPhotos = [];
      for (const file of files) {
        const url = await handleImageUpload(file, '');
        if (url) newPhotos.push(url);
      }
      updateData.photos = [...(existing.photos || []), ...newPhotos];
    }

    const event = await updateEventEntry(req.params.id, updateData);
    res.json({ success: true, event });
  } catch (err) {
    console.error('Update event error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin API: remove a single photo from an event
router.put('/api/events/:id/remove-photo', adminAuth, async (req, res) => {
  try {
    const existing = await getEventEntry(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event nahi mila' });
    }

    const { photoUrl } = req.body;
    const photos = (existing.photos || []).filter((p) => p !== photoUrl);

    if (photoUrl && photoUrl.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', 'public', photoUrl);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.warn('Photo delete fail:', e.message);
        }
      }
    }

    const event = await updateEventEntry(req.params.id, { photos });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin API: delete whole event entry
router.delete('/api/events/:id', adminAuth, async (req, res) => {
  try {
    const existing = await getEventEntry(req.params.id);
    if (existing && Array.isArray(existing.photos)) {
      existing.photos.forEach((p) => {
        if (p && p.startsWith('/uploads/')) {
          const imgPath = path.join(__dirname, '..', 'public', p);
          if (fs.existsSync(imgPath)) {
            try {
              fs.unlinkSync(imgPath);
            } catch (e) {
              console.warn('Photo delete fail:', e.message);
            }
          }
        }
      });
    }
    await deleteEventEntry(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin panel page
router.get('/admin/events', adminAuth, async (req, res) => {
  try {
    const events = await getAllEventEntries();
    res.render('admin/events', { title: 'Admin — Event Gallery', events });
  } catch (err) {
    console.error('Admin events error:', err.message);
    res.render('admin/events', {
      title: 'Admin — Event Gallery',
      events: [],
      error: `DB Error: ${err.message}`,
    });
  }
});

module.exports = router;
