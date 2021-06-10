const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router();

//adds contacts to user
router.post('/add', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId;
    const arrayUnion = admin.firestore.FieldValue.arrayUnion;

    await db.collection('users').doc(userId).update({
        contacts: arrayUnion(req.body[0])
    });

    res.send("done");
});

//returns an array of a user's contacts
router.get('/', checkIfAuthenticated, async (req, res) => {
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
                data: userData,
                status: 200,
            }
            res.status(200).send(data);
        }
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

    await db.collection('users').doc(userId).update({
        contacts: arrayRemove(req.body[0])
    });

    res.send("deleted");
});

module.exports = router;