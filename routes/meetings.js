var express  = require('express')
const db = require('../db')
var router = express.Router()
var admin  = require('firebase-admin')
var checkIfAuthenticated = require('../middlewares/authentication_middleware');

//Get All Meetings
router.get('/', checkIfAuthenticated, async (req, res, next) => {
    const query = db.collection('users').doc("4jEjIVIawXVwduXTLc7s");
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        res.send(querySnapshot.data());
    }else{
        res.send('No Meetings Found for current user')
    }
});

//Get Meeting by ID
router.get('/:id', async (req, res, next) => {
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
            let result_id = querySnapshot.id
            let result = querySnapshot.data();

        const data = {
                    id: result_id,
                    meetingData: result
                }

         if(data.meetingData.invitedUsers.includes("4jEjIVIawXVwduXTLc7s") || data.meetingData.ownerUID === "4jEjIVIawXVwduXTLc7s"){
            res.send(data)
         }else{
            res.send('Not Authorized to access this meeting')
        }
    }else{
            res.send('No Result Found')
        }
});

//Adding a new Meeting
router.post('/add', async (req, res, next) => {
    const data = {
        meetingDetails: {
            title : req.body.title,
            ownerUID : req.body.ownerUID,
            ownerName : req.body.ownerName,
            date : admin.firestore.FieldValue.serverTimestamp(),
            geoLocation : req.body.geoLocation,
            invitedUsers: req.body.invitedUsers
        }
    }
    const meetingsQuerySnapshot = await db.collection('meetings').add(data.meetingDetails);
    await db.collection('users').doc(data.meetingDetails.ownerUID).update({meetings: admin.firestore.FieldValue.arrayUnion(meetingsQuerySnapshot.id)});

    for (const user of data.meetingDetails.invitedUsers) {
        await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayUnion(meetingsQuerySnapshot.id)})
    }
    res.send("Created New Meeting")
});

//Update a Meeting
router.put('/update/:id', async (req, res, next) =>{
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let result = querySnapshot.data();
        let invitedUsers = result.invitedUsers;

        if(result.ownerUID === "4jEjIVIawXVwduXTLc7s"){ //req.authId
            const data = {
                meetingDetails: {
                    title : req.body.title,
                    ownerUID : req.body.ownerUID,
                    ownerName : req.body.ownerName,
                    date : admin.firestore.FieldValue.serverTimestamp(),
                    geoLocation : req.body.geoLocation,
                    invitedUsers: req.body.invitedUsers
                }
            }
            await db.collection('meetings').doc(req.params.id).set(data.meetingDetails)

            for (const user of invitedUsers) {
                if(!data.meetingDetails.invitedUsers.includes(user)){
                    await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)})
                }
            }

            for (const user of data.meetingDetails.invitedUsers) {
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayUnion(req.params.id)})
            }
            res.send('Meeting Updated!')
        }else{
            res.send('Not Authorized to access this meeting')
        }
    }else{
        res.sendStatus(404)
    }
});

//Delete a Meeting
router.delete('/delete/:id', async (req, res, next) =>{
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let invitedUsers = querySnapshot.data().invitedUsers
        invitedUsers.push(querySnapshot.data().ownerUID)
        for (const user of invitedUsers) {
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)})
        }
        await query.delete()
        res.send('Meeting Deleted!')
    }else{
        res.sendStatus(404)
    }

})


module.exports = router;
