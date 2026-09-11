const admin = require('firebase-admin');

// Firebase Admin instance
let firebaseApp;
let firestore;

const initializeFirebase = () => {
  try {
    // Pehle se init hai to return karo
    if (firebaseApp) {
      return firestore;
    }

    // Env vars se credentials uthao
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.error('Firebase credentials missing hain');
      return null;
    }

    // App init
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      projectId,
    });

    firestore = admin.firestore();

    // Cache settings
    firestore.settings({
      ignoreUndefinedProperties: true,
      cacheSizeBytes: 50000000,
    });

    console.log('Firebase ready');
    return firestore;
  } catch (error) {
    console.error('Firebase error:', error.message);
    return null;
  }
};

// Module load pe init
const db = initializeFirebase();

const getFirestore = () => {
  return db || initializeFirebase();
};

// Naya artwork add karo
const createArtwork = async (artworkData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const artworksRef = db.collection('artworks');
    const docRef = await artworksRef.add({
      ...artworkData,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { ...artworkData, id: docRef.id };
  } catch (error) {
    throw new Error(`Artwork create fail: ${error.message}`);
  }
};

// Saare artworks fetch karo
const getAllArtworks = async (filters = {}) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    let query = db.collection('artworks');

    // Category filter lagao
    const hasCategoryFilter = filters.category && filters.category !== 'All';
    if (hasCategoryFilter) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.search) {
      query = query.limit(100);
    }

    // Category filter ke saath orderBy composite index maangta hai,
    // isliye filter hone par in-memory sort karo.
    if (!hasCategoryFilter && !filters.search) {
      query = query.orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const artworks = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate?.().toISOString?.().split('T')[0] || data.createdAt;
      }
      artworks.push({
        ...data,
        id: doc.id, // Firestore doc ID hamesha jeette (stored `id` field ko override na kare)
      });
    });

    // Filtered results ko date se sort karo (newest pehle)
    if (hasCategoryFilter || filters.search) {
      artworks.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }

    // In-memory search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return artworks.filter(art =>
        art.name?.toLowerCase().includes(searchLower) ||
        art.category?.toLowerCase().includes(searchLower) ||
        art.description?.toLowerCase().includes(searchLower) ||
        (art.tags && art.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    return artworks;
  } catch (error) {
    throw new Error(`Artworks get fail: ${error.message}`);
  }
};

// Single artwork slug ya ID se nikalo
const getArtwork = async (idOrSlug) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    // Pehle doc ID se check karo
    const docSnapshot = await db.collection('artworks').doc(idOrSlug).get();
    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate?.().toISOString?.().split('T')[0] || data.createdAt;
      }
      return {
        ...data,
        id: docSnapshot.id,
      };
    }

    // Slug ya legacy custom `id` field se try karo
    for (const field of ['slug', 'id']) {
      const snapshot = await db
        .collection('artworks')
        .where(field, '==', idOrSlug)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        if (data.createdAt) {
          data.createdAt = data.createdAt.toDate?.().toISOString?.().split('T')[0] || data.createdAt;
        }
        return {
          ...data,
          id: doc.id,
        };
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Artwork get fail: ${error.message}`);
  }
};

// Artwork update karo
const updateArtwork = async (docId, updateData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('artworks').doc(docId).update({
      ...updateData,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const updatedDoc = await db.collection('artworks').doc(docId).get();
    const data = updatedDoc.data();
    if (data.createdAt) {
      data.createdAt = data.createdAt.toDate?.().toISOString?.().split('T')[0] || data.createdAt;
    }
    return {
      ...data,
      id: updatedDoc.id,
    };
  } catch (error) {
    throw new Error(`Artwork update fail: ${error.message}`);
  }
};

// Artwork delete karo
const deleteArtwork = async (docId) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('artworks').doc(docId).delete();
    return true;
  } catch (error) {
    throw new Error(`Artwork delete fail: ${error.message}`);
  }
};

// Old ID lookup (migration ke liye)
const getArtworkByCustomId = async (customId) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await db
      .collection('artworks')
      .where('id', '==', customId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate?.().toISOString?.().split('T')[0] || data.createdAt;
      }
      return {
        ...data,
        id: doc.id,
      };
    }

    return null;
  } catch (error) {
    throw new Error(`Artwork custom ID get fail: ${error.message}`);
  }
};

// ---- Bookings ----

// Nayi booking save karo
const createBooking = async (bookingData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = await db.collection('bookings').add({
      ...bookingData,
      status: bookingData.status || 'pending',
      createdAt: admin.firestore.Timestamp.now(),
    });

    return { id: docRef.id, ...bookingData };
  } catch (error) {
    throw new Error(`Booking create fail: ${error.message}`);
  }
};

// Saari bookings (newest pehle)
const getAllBookings = async () => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await db.collection('bookings').get();
    const bookings = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        data.createdAt =
          data.createdAt.toDate?.().toISOString?.() || data.createdAt;
      }
      bookings.push({ id: doc.id, ...data });
    });

    bookings.sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );

    return bookings;
  } catch (error) {
    throw new Error(`Bookings get fail: ${error.message}`);
  }
};

// Ek booking id se nikalo
const getBooking = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (data.createdAt) {
      data.createdAt = data.createdAt.toDate?.().toISOString?.() || data.createdAt;
    }
    return { id: doc.id, ...data };
  } catch (error) {
    throw new Error(`Booking get fail: ${error.message}`);
  }
};

// Booking status update karo (pending / confirmed / done / cancelled)
const updateBookingStatus = async (id, status) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('bookings').doc(id).update({
      status,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { id, status };
  } catch (error) {
    throw new Error(`Booking update fail: ${error.message}`);
  }
};

// Booking delete karo
const deleteBooking = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('bookings').doc(id).delete();
    return { id };
  } catch (error) {
    throw new Error(`Booking delete fail: ${error.message}`);
  }
};

// ---- Content cards (Services / Workshops program cards) ----
// `type` field separates them: 'service' | 'workshop'

const createContentCard = async (type, cardData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    // Naya card list ke end me jaaye
    const existing = await db.collection('content_cards').where('type', '==', type).get();
    const maxOrder = existing.docs.reduce((max, d) => Math.max(max, d.data().order || 0), 0);

    const docRef = await db.collection('content_cards').add({
      ...cardData,
      type,
      order: maxOrder + 1,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { ...cardData, type, id: docRef.id };
  } catch (error) {
    throw new Error(`Content card create fail: ${error.message}`);
  }
};

const getContentCards = async (type) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await db.collection('content_cards').where('type', '==', type).get();
    const cards = [];
    snapshot.forEach((doc) => {
      cards.push({ ...doc.data(), id: doc.id });
    });
    cards.sort((a, b) => (a.order || 0) - (b.order || 0));
    return cards;
  } catch (error) {
    throw new Error(`Content cards get fail: ${error.message}`);
  }
};

const getContentCard = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('content_cards').doc(id).get();
    if (!doc.exists) return null;
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Content card get fail: ${error.message}`);
  }
};

const updateContentCard = async (id, updateData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('content_cards').doc(id).update({
      ...updateData,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const doc = await db.collection('content_cards').doc(id).get();
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Content card update fail: ${error.message}`);
  }
};

const deleteContentCard = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('content_cards').doc(id).delete();
    return { id };
  } catch (error) {
    throw new Error(`Content card delete fail: ${error.message}`);
  }
};

// Card order badlo (drag/reorder ke liye) — array of {id, order}
const reorderContentCards = async (updates) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const batch = db.batch();
    updates.forEach(({ id, order }) => {
      batch.update(db.collection('content_cards').doc(id), { order });
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    throw new Error(`Reorder fail: ${error.message}`);
  }
};

// ---- Page content (headers / stats — singleton doc per page) ----

const getPageContent = async (pageKey, defaults = {}) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('page_content').doc(pageKey).get();
    if (!doc.exists) return { ...defaults };
    return { ...defaults, ...doc.data() };
  } catch (error) {
    throw new Error(`Page content get fail: ${error.message}`);
  }
};

const savePageContent = async (pageKey, data) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('page_content').doc(pageKey).set(
      { ...data, updatedAt: admin.firestore.Timestamp.now() },
      { merge: true }
    );

    return { pageKey, ...data };
  } catch (error) {
    throw new Error(`Page content save fail: ${error.message}`);
  }
};

// ---- Event gallery (past workshops / camps — photos + details) ----

const createEventEntry = async (eventData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = await db.collection('event_photos').add({
      ...eventData,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { ...eventData, id: docRef.id };
  } catch (error) {
    throw new Error(`Event entry create fail: ${error.message}`);
  }
};

const getAllEventEntries = async () => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await db.collection('event_photos').get();
    const events = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        ...data,
        id: doc.id,
        eventDate: data.eventDate || '',
      });
    });
    // Newest event date pehle
    events.sort((a, b) => String(b.eventDate || '').localeCompare(String(a.eventDate || '')));
    return events;
  } catch (error) {
    throw new Error(`Event entries get fail: ${error.message}`);
  }
};

const getEventEntry = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('event_photos').doc(id).get();
    if (!doc.exists) return null;
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Event entry get fail: ${error.message}`);
  }
};

const updateEventEntry = async (id, updateData) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('event_photos').doc(id).update({
      ...updateData,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const doc = await db.collection('event_photos').doc(id).get();
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Event entry update fail: ${error.message}`);
  }
};

const deleteEventEntry = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('event_photos').doc(id).delete();
    return { id };
  } catch (error) {
    throw new Error(`Event entry delete fail: ${error.message}`);
  }
};

// ---- Testimonials ----
// `category` field: 'homepage' | 'workshop'

const createTestimonial = async (category, data) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const existing = await db.collection('testimonials').where('category', '==', category).get();
    const maxOrder = existing.docs.reduce((max, d) => Math.max(max, d.data().order || 0), 0);

    const docRef = await db.collection('testimonials').add({
      ...data,
      category,
      order: maxOrder + 1,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { ...data, category, id: docRef.id };
  } catch (error) {
    throw new Error(`Testimonial create fail: ${error.message}`);
  }
};

const getTestimonials = async (category) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await db.collection('testimonials').where('category', '==', category).get();
    const items = [];
    snapshot.forEach((doc) => items.push({ ...doc.data(), id: doc.id }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    return items;
  } catch (error) {
    throw new Error(`Testimonials get fail: ${error.message}`);
  }
};

const getTestimonial = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('testimonials').doc(id).get();
    if (!doc.exists) return null;
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Testimonial get fail: ${error.message}`);
  }
};

const updateTestimonial = async (id, data) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('testimonials').doc(id).update({
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const doc = await db.collection('testimonials').doc(id).get();
    return { ...doc.data(), id: doc.id };
  } catch (error) {
    throw new Error(`Testimonial update fail: ${error.message}`);
  }
};

const deleteTestimonial = async (id) => {
  try {
    const db = getFirestore();
    if (!db) throw new Error('Firestore not initialized');

    await db.collection('testimonials').doc(id).delete();
    return { id };
  } catch (error) {
    throw new Error(`Testimonial delete fail: ${error.message}`);
  }
};

module.exports = {
  getFirestore,
  createBooking,
  getAllBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
  createArtwork,
  getAllArtworks,
  getArtwork,
  getArtworkByCustomId,
  updateArtwork,
  deleteArtwork,
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
  admin,
};
