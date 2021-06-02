const admin = require('firebase-admin');

// Configure firebase
var serviceAccount = require("./connfy_firebase_cred.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;