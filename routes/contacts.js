var express = require('express');
const db = require('../db');
var router = express.Router();

//adds contacts to userID
router.get('/add', async (req, res, next) => {
    const userUID = "asdjawdjawdg"
    const user2UID = "rgasdasdzas"
    const user3UID = "hcvbsdfyjrt"

    var contact1 = await db.collection('users_testing').doc(user2UID).get();
    var contact2 = await db.collection('users_testing').doc(user3UID).get();

    await db.collection('users_testing').doc(userUID).collection('contacts').doc(user2UID).set({
        name: contact1.data().name
    });

    await db.collection('users_testing').doc(userUID).collection('contacts').doc(user3UID).set({
        name: contact2.data().name
    });

    res.send("done");
});

//returns an array of contacts userUID for a specific user
router.get('/', async (req, res, next) => {
    const userUID = "asdjawdjawdg"

    var contacts = [];

    const contactsRef = db.collection('users_testing').doc(userUID).collection('contacts');
    const snapshot = await contactsRef.get();

    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        contacts.push(doc.id);
    });

    res.send(contacts);
});

//deletes contact from user
router.get('/delete', async (req, res, next) => {
    const userUID = "asdjawdjawdg"
    const user2UID = "rgasdasdzas"

    await db.collection('users_testing').doc(userUID).collection('contacts').doc(user2UID).delete();

    res.send("deleted");
});

module.exports = router;