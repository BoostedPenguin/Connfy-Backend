const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router();

//adds contacts to user
router.post('/add', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    const arrayUnion = admin.firestore.FieldValue.arrayUnion;

    try {
        await db.collection('users').doc(userId).update({
            contacts: arrayUnion(req.body[0])
        });
        res.send("done");
    } catch (e) {
        res.status(404).send(e);
    };
});

//returns an array of a user's contacts
router.get('/', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    try {
        const contacts = (await db.collection('users').doc(userId).get()).data().contacts;
        if (contacts.length > 0)
            res.send(contacts);
        else
            res.status(204).send();
    } catch (e) {
        res.status(404).send(e);
    };
});

//deletes contact from user
router.post('/delete', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    const arrayRemove = admin.firestore.FieldValue.arrayRemove;
    try {
        await db.collection('users').doc(userId).update({
            contacts: arrayRemove(req.body[0])
        });
        res.send("deleted");
    } catch (e) {
        res.status(404).send(e);
    };
});

module.exports = router;