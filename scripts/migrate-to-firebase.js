#!/usr/bin/env node

// JSON se Firestore me artworks migrate karne ki script

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Firebase setup
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateArtworks() {
  try {
    console.log('Firebase Firestore migration shuru...\n');

    // JSON file read karo
    const artworksPath = path.join(__dirname, '../data/artworks.json');
    const artworksData = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));

    console.log(`${artworksData.length} artworks mile data/artworks.json me\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Har artwork upload karo
    for (const artwork of artworksData) {
      try {
        const docRef = db.collection('artworks').doc(artwork.id);
        
        const firestoreData = {
          ...artwork,
          createdAt: artwork.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        await docRef.set(firestoreData);
        
        successCount++;
        console.log(`Migrated: ${artwork.name} (${artwork.id})`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Fail hua ${artwork.name} (${artwork.id}): ${error.message}`;
        console.log(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Success: ${successCount}`);
    console.log(`Fail: ${errorCount}`);

    // Verify karo
    const snapshot = await db.collection('artworks').get();
    console.log(`Firestore me total documents: ${snapshot.size}`);

    console.log('Migration poora hua!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateArtworks();
