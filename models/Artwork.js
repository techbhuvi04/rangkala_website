const mongoose = require('mongoose');

// Artwork database schema
const artworkSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  medium: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  price: { type: String, default: '' },
  available: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  tags: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

module.exports = mongoose.model('Artwork', artworkSchema);
