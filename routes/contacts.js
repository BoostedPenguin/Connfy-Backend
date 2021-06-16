const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router();

// returns all contacts
async function getContacts(req, res) {
    const userId = req.authId;
    const contacts = (await db.collection('users').doc(userId).get()).data().contacts;
    try {
        if (contacts.length > 0) {
            let userData = []

            await Promise.all(contacts.map(async (userId) => {
                let userDoc = await db.collection('users').doc(userId).get()

                let ssh = {
                    uid: userDoc.id,
                    hasOutlook: userDoc.data().hasOutlook,
                    name: userDoc.data().name,
                    email: userDoc.data().email,
                }
                userData.push(ssh)
            }))

            const data = {
                data: userData
            }
            res.status(200).send(data);
        } else
            res.sendStatus(204);
    } catch (e) {
        res.status(404).send(e);
    }
}

//adds contact to user and returns all contacts
router.post('/add', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    const arrayUnion = admin.firestore.FieldValue.arrayUnion;
    try {
        await db.collection('users').doc(userId).update({
            contacts: arrayUnion(req.body.contact_uid)
        });

        await getContacts(req, res);
    } catch (e) {
        res.status(404).send(e);
    }
});

//returns an array of a user's contacts
router.get('/', checkIfAuthenticated, async (req, res) => {
    await getContacts(req, res);
});

//deletes contact from user and returns all contacts
router.post('/delete', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    const arrayRemove = admin.firestore.FieldValue.arrayRemove;
    try {
        await db.collection('users').doc(userId).update({
            contacts: arrayRemove(req.body.contact_uid)
        });

        await getContacts(req, res);
    } catch (e) {
        res.status(404).send(e);
    }
});

module.exports = router;