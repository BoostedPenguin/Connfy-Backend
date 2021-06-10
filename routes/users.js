const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router();

// On person registration add him to firestore 
router.post('/create', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;

    await db.collection('users').doc(userId).set({
        name: req.body.name ? req.body.name : "",
        hasOutlook: false,
        meetings: [],
        contacts: [],
        date : admin.firestore.FieldValue.serverTimestamp(),
    }).then();

    const userObj = await db.collection('users').doc(userId).get()
    const userData = userObj.data()

    const data = {
        uid: userObj.id,
        name: userData.name,
        hasOutlook: userData.hasOutlook,
        meetings: userData.meetings,
        contacts: userData.contacts,
        date : userData.date,
    }

    res.send({data: data});
});

module.exports = router;
