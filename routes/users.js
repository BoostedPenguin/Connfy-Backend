const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router();

// On person registration add him to firestore 
router.post('/create', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    console.log("Wtf")

    const docRef = await db.collection('users').doc(userId).get()

    if(docRef.exists) {
        db.collection('users').doc(userId).delete()
    }

    await db.collection('users').doc(userId).set({
        name: req.body.name ? req.body.name : "",
        hasOutlook: false,
        meetings: [],
        contacts: [],
        date : admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send()
});

// On person registration add him to firestore 
router.get('/', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;

    const docMain = await db.collection('users').doc(userId).get()
    const docData = await docMain.data()


    const data = {
        uid: docMain.id,
        name: docData.name,
        hasOutlook: docData.hasOutlook,
        date : docData.date,
    }

    res.send({data: data});
});

module.exports = router;
