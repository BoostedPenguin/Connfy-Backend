const admin = require('firebase-admin');

// Configure firebase

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});



const db = admin.firestore();

module.exports = db;