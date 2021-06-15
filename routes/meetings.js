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
                uid: snapshot.id,
                ownerUid: req.authId,
                ownerName: snapshot.data().ownerName,
                invitedUsersIds: snapshot.data().invitedUsers,
                geoLocation: snapshot.data().geoLocation,
                title: snapshot.data().title,
                isOutlook: snapshot.data().isOutlook,
                date: snapshot.data().date
            };

            allMeetings.push(meetingData);
        }
        allMeetings.sort((a, b) => (a.date.seconds > b.date.seconds) ? 1 : -1)

        res.send({data:  allMeetings});
    }else{
        res.sendStatus(204);
    }
});

//Get Meeting by ID
router.get('/:id', checkIfAuthenticated, async (req, res, next) => {
   await getMeeting(req, res)
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
            invitedUsers: req.body.invitedUsers,
            isOutlook: req.body.isOutlook
        }
    };
    const meetingsQuerySnapshot = await db.collection('meetings').add(data.meetingDetails);
    if(await addUsers(data.meetingDetails.invitedUsers, meetingsQuerySnapshot.id)){
        await db.collection('users').doc(data.meetingDetails.ownerUID).update({meetings: admin.firestore.FieldValue.arrayUnion(meetingsQuerySnapshot.id)});
        await getMeeting(req, res, meetingsQuerySnapshot.id)
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
                invitedUsers: result.invitedUsers,
                isOutlook: result.isOutlook
            }
        }

        if(result.ownerUID === req.authId){
            if(req.body.title !== undefined) data.meetingDetails.title = req.body.title;
            if(req.body.ownerName !== undefined) data.meetingDetails.ownerName = req.body.ownerName;
            if(req.body.geoLocation !== undefined) data.meetingDetails.geoLocation = req.body.geoLocation;
            if(req.body.invitedUsers !== undefined) data.meetingDetails.invitedUsers = req.body.invitedUsers;

            await db.collection('meetings').doc(req.params.id).set(data.meetingDetails);

            if(await addUsers(data.meetingDetails.invitedUsers, req.params.id)){
                await db.collection('users').doc(data.meetingDetails.ownerUID).update({meetings: admin.firestore.FieldValue.arrayUnion(req.params.id)});
                for (const user of invitedUsers) {
                    if(!data.meetingDetails.invitedUsers.includes(user)){
                        await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)});
                    }
                }
                await getMeeting(req, res)
            }else{
                await db.collection('meetings').add(data.meetingDetails);
                res.send("Error while adding users").status(500);
            }
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

    const ownerQuery = db.collection('meetings').doc(req.params.id)
    const ownerSnapshot = await ownerQuery.get()

    if(ownerSnapshot.data().ownerUID === req.authId){
        if(querySnapshot.exists){
            let invitedUsers = querySnapshot.data().invitedUsers;
            invitedUsers.push(req.authId);
            for (const user of invitedUsers) {
                await db.collection('users').doc(user).update({meetings: admin.firestore.FieldValue.arrayRemove(req.params.id)});
            }
            await query.delete();
            res.send("");
        }else{
            res.sendStatus(404);
        }
    }else{
        res.sendStatus(403);
    }
})

async function getMeeting(req, res, id){
    let meetingId = req.params.id;
    if(meetingId === undefined) meetingId = id

    const query = db.collection('meetings').doc(meetingId);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let result_id = querySnapshot.id;
        let result = querySnapshot.data();

        const data = {
            uid: result_id,
            ownerUid: result.ownerUID,
            ownerName: result.ownerName,
            invitedUsers: [],
            geoLocation: result.geoLocation,
            title: result.title,
            date: result.date
        };

        await Promise.all(result.invitedUsers.map(async (user) => {
            let snapshot = await db.collection('users').doc(user).get();
            if(snapshot.exists){
                const userData ={
                    uid: snapshot.id,
                    name: snapshot.data().name
                }
                data.invitedUsers.push(userData)
            }
        }))

        let uid = data.invitedUsers.find(obj => {
            return obj.uid === req.authId
        })

        if(uid !== undefined || data.ownerUid === req.authId){
            res.send({data: data});
        }else{
            res.sendStatus(403);
        }
    }else{
        res.sendStatus(404);
    }
}

// router.post('/users/:id', checkIfAuthenticated, async (req, res, next) => {
//     const meetingsQuerySnapshot = await db.collection('meetings').doc(req.params.id)
    
//     var meetingData = (await meetingsQuerySnapshot.get()).data()

//     if(!meetingData.invitedUsers.includes(req.authId) && meetingData.ownerUID != req.authID) {
//         return res.sendStatus(403)
//     }

//     meetingData.

//     console.log(req.body.additonalUsers)

//     await meetingsQuerySnapshot.update({
//         invitedUsers : req.body.additonalUsers
//     })

//     await addUsers()

//     await getMeeting(req, res)
// })


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
module.exports = router;
