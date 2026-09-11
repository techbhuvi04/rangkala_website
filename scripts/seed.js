require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Artwork = require('../models/Artwork');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

const uri = MONGO_URL.includes('?') 
    ? MONGO_URL.replace('?', `${DB_NAME}?`) 
    : `${MONGO_URL}/${DB_NAME}`;

// Local MongoDB me test data daalne ki script
async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');

    // Purana data saaf karo
    await Artwork.deleteMany({});

    // JSON file padho
    const jsonPath = path.join(__dirname, '..', 'data', 'artworks.json');
    if (!fs.existsSync(jsonPath)) {
      console.log('artworks.json nahi mila');
      process.exit(0);
    }
    
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const artworks = JSON.parse(rawData);

    // Tags aur price format karo
    const updatedArtworks = artworks.map(art => {
      const newPrice = Math.floor(Math.random() * (3000 - 800 + 1)) + 800;
      
      return {
        ...art,
        price: '₹' + newPrice.toLocaleString('en-IN'),
        tags: [art.category, art.medium.split(' ')[0]].filter(t => t).map(t => t.trim())
      };
    });

    await Artwork.insertMany(updatedArtworks);
    console.log(`${updatedArtworks.length} artworks insert ho gaye`);

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
