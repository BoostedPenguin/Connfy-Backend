let express  = require('express')
const db = require('../db')
let router = express.Router()
let admin  = require('firebase-admin')
let checkIfAuthenticated = require('../middlewares/authentication_middleware');

//Get All Meetings
router.get('/', checkIfAuthenticated, async (req, res, next) => {
const allUserMeetingsRef = db.collection('users').doc(req.authId);
    const allUserMeetingsSnapshot = await allUserMeetingsRef.get();

    if(allUserMeetingsSnapshot.exists){
        let allMeetings = [];

        for (const meeting of allUserMeetingsSnapshot.data().meetings) {
            const snapshot = await db.collection('meetings').doc(meeting).get();
            const meetingData = {
                id: snapshot.id,
                details: snapshot.data()
            };
            allMeetings.push(meetingData);
        }
        res.send(allMeetings);
    }else{
        res.sendStatus(204);
    }
});

//Get Meeting by ID
router.get('/:id', checkIfAuthenticated, async (req, res, next) => {
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
            let result_id = querySnapshot.id;
            let result = querySnapshot.data();

        const data = {
                    id: result_id,
                    meetingData: result
                };

         if(data.meetingData.invitedUsers.includes(req.authId) || data.meetingData.ownerUID === req.authId){
            res.send(data);
         }else{
            res.sendStatus(403);
        }
    }else{
            res.sendStatus(404);
        }
});

//Adding a new Meeting
router.post('/add', checkIfAuthenticated, async (req, res, next) => {
    const data = {
        meetingDetails: {
            title : req.body.title,
            ownerUID : req.authId,
            ownerName : req.body.ownerName,
            date : admin.firestore.FieldValue.serverTimestamp(),
            geoLocation : req.body.geoLocation,
            invitedUsers: req.body.invitedUsers
        }
    };
    const meetingsQuerySnapshot = await db.collection('meetings').add(data.meetingDetails);
    if(await addUsers(data.meetingDetails.invitedUsers, meetingsQuerySnapshot.id)){
        await db.collection('users').doc(data.meetingDetails.ownerUID).update({meetings: admin.firestore.FieldValue.arrayUnion(meetingsQuerySnapshot.id)});
        res.send(data);
    }else{
        await db.collection('meetings').add(data.meetingDetails);
        res.send("Error while adding users").status(500);
    }


});

//Update a Meeting
router.put('/update/:id', checkIfAuthenticated, async (req, res, next) =>{
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let result = querySnapshot.data();
        let invitedUsers = result.invitedUsers;

        let data = {
            meetingDetails: {
                title : result.title,
                ownerName : result.ownerName,
                ownerUID: req.authId,
                date : result.date,
                geoLocation : result.geoLocation,
                invitedUsers: result.invitedUsers
            }
        }

        if(result.ownerUID === req.authId){
            if(req.body.title !== undefined) data.meetingDetails.title = req.body.title;
            if(req.body.ownerName !== undefined) data.meetingDetails.title = req.body.ownerName;
            if(req.body.geoLocation !== undefined) data.meetingDetails.title = req.body.geoLocation;
            if(req.body.invitedUsers !== undefined) data.meetingDetails.title = req.body.invitedUsers;

            await db.collection('meetings').doc(req.params.id).set(data.meetingDetails);

            for (const user of invitedUsers) {
                if(!data.meetingDetails.invitedUsers.includes(user)){
                    await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)});
                }
            }

            for (const user of data.meetingDetails.invitedUsers) {
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayUnion(req.params.id)});
            }
            res.send('Meeting Updated!');
        }else{
            res.sendStatus(403);
        }
    }else{
        res.sendStatus(404);
    }
});

//Delete a Meeting
router.delete('/delete/:id', checkIfAuthenticated, async (req, res, next) =>{
    const query = db.collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let invitedUsers = querySnapshot.data().invitedUsers;
        invitedUsers.push(req.authId);
        for (const user of invitedUsers) {
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)});
        }
         await query.delete();
        res.send('Meeting Deleted!');
    }else{
        res.sendStatus(404);
    }

})


async function addUsers(invitedUsers, meetingId){
    if(Array.isArray(invitedUsers)){
        await Promise.all(invitedUsers.map(async (user) => {
            if((await db.collection('users').doc(user).get()).exists){
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayUnion(meetingId)})
            }
        }))
        return true;
    }else{
        return false;
    }
}
async function removeUsers(usersToBeRemoved, meetingId){
    if(Array.isArray(usersToBeRemoved)){
        await Promise.all(usersToBeRemoved.map(async (user) => {
            let userSnapshot = await db.collection('users').doc(user).get();
            if(userSnapshot.exists && userSnapshot.data().meetings && userSnapshot.data().meetings.includes(meetingId)){
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(meetingId)})
            }
        }))
        return true;
    }else{
        return false;
    }
}

module.exports = router;
