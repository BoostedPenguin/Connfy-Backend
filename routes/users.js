const express = require('express')
const db = require('../db')
const admin = require('firebase-admin')
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const router = express.Router()

// On person registration add him to firestore 
router.post('/create', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId

    const provider = req.body.provider

    const docRef = await db.collection('users').doc(userId).get()

    if (docRef.exists) {

        if (docRef.data().email == undefined || docRef.data().email == "") {
            await db.collection('users').doc(userId).set({
                email: req.body.email
            }, { merge: true })
        }

        // Check if provider is google to avoid overriding data
        if (provider == "GOOGLE") {
            return res.send()
        }
        else {
            db.collection('users').doc(userId).delete()
        }
    }


    let insertingModel = {
        hasOutlook: false,
        meetings: ["yDYdrhMx4cYEbhejB9Pp"],
        contacts: [],
        provider: provider,
        date: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (req.body.name) {
        insertingModel.name = req.body.name
    }
    await db.collection('meetings').doc('yDYdrhMx4cYEbhejB9Pp').update({
        invitedUsers: admin.firestore.FieldValue.arrayUnion(userId)
    })

    await db.collection('users').doc(userId).set(insertingModel)

    res.send()
})


// Get basic user data on login
router.get('/', checkIfAuthenticated, async (req, res) => {
    const userId = req.authId

    const docMain = await db.collection('users').doc(userId).get()
    const docData = await docMain.data()


    const data = {
        uid: docMain.id,
        name: docData.name,
        hasOutlook: docData.hasOutlook,
        date: docData.date,
    }

    res.send({ data: data })
})

module.exports = router
