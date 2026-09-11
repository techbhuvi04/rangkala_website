require('dotenv').config();
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// EJS view engine set kar rahe hain
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const cookieParser = require('cookie-parser');

// Firebase setup
const { getFirestore } = require('./lib/firebase');

// Connection error store karne ke liye
let lastConnectionError = null;

// Firebase start karo
const initDb = async () => {
  try {
    const db = getFirestore();
    if (db) {
      console.log('Firebase Firestore ready hai');
      lastConnectionError = null;
    } else {
      console.warn('Firebase Firestore credentials check karo');
      lastConnectionError = 'Firebase not initialized';
    }
  } catch (err) {
    console.error('Firebase start error:', err.message);
    lastConnectionError = err.message;
  }
};

// Server start pe DB initialize
initDb();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Template variables pass karo
app.use((req, res, next) => {
  res.locals.backendUrl = BACKEND_URL;
  res.locals.currentPath = req.path;
  res.locals.dbError = lastConnectionError;
  next();
});

// Artwork routes
const artworksRouter = require('./routes/artworks');
app.use('/', artworksRouter);

// Backend API proxy (artworks, bookings, contact chhod ke — wo Node me hi handle hote hain)
const LOCAL_API_PREFIXES = ['/artworks', '/bookings', '/contact'];
const isLocalApi = (p) => LOCAL_API_PREFIXES.some((prefix) => p.startsWith(prefix));

const proxyMiddleware = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
  router: (req) => {
    if (isLocalApi(req.path)) {
      return false;
    }
    return BACKEND_URL;
  }
});

app.use('/api', (req, res, next) => {
  if (isLocalApi(req.path)) {
    return next();
  }
  proxyMiddleware(req, res, next);
});

// Page routes
app.get('/about', (req, res) => {
  res.render('about', { title: 'About — RangKala Creations' });
});

app.get('/book', (req, res) => {
  res.render('book', { title: 'Book a Slot — RangKala Creations' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact — RangKala Creations' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error handler:', err);
  
  if (req.path.startsWith('/api/')) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({ success: false, message });
  }
  
  res.status(err.statusCode || 500).render('error', { 
    title: 'Error',
    error: err.message 
  });
});

// Local dev server start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
  });
}

module.exports = app;
