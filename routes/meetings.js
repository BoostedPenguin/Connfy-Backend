var express  = require('express')
const db = require('../db')
var router = express.Router()
var checkIfAuthenticated = require('../middlewares/authentication_middleware');

//Get All Meetings
router.get('/', async (req, res, next) => {
    const query = db.collection('users_testing').doc('asdjawdjawdg').collection('meetings');
    const querySnapshot = await query.get();

    let result = [];

    if(querySnapshot.size > 0){
        querySnapshot.forEach(doc =>{
            console.log(doc.id + '=>' + doc.data());
            result.push(doc.id, doc.data());
        });
        res.send(result);
    }else{
        res.send('No Meetings Found for current user')
    }
});

//Get Meeting by ID
router.get('/:id', async (req, res, next) => {
    const query = db.collection('users_testing').doc('asdjawdjawdg').collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();
    const query1 = db.collection('users_testing').doc('asdjawdjawdg').collection('meetings').doc(req.params.id).collection('invitedUsers');
    const querySnapshot1 = await query1.get();

    if(querySnapshot.exists){
            let result_id = querySnapshot.id
            let result = querySnapshot.data();

        const data = {
                    id: result_id,
                    meetingData: result,
                    invitedUsers: []
                }
        querySnapshot1.forEach(uid=>{
            data.invitedUsers.push(uid.id, uid.data())
        })
        if(data.invitedUsers.includes("dawg") || data.meetingData.ownerUID === "hcvbsdfyjrt"){
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
            description : req.body.description,
            ownerUID : req.body.ownerUID,
            ownerName : req.body.ownerName,
            time : req.body.time,
            geoLocation : req.body.geoLocation
        },
        invitedUsers: req.body.invitedUsers
    }
    const querySnapshot = await db.collection('meetings_testing').add(data.meetingDetails)

    await Promise.all(data.invitedUsers.map(async (uid) => {
        var userSnapshot = await db.collection('users_testing').doc(uid).get()
        await db.collection('meetings_testing').doc(querySnapshot.id).collection('invitedUsers').doc(uid).set({name:userSnapshot.data().name})
    }))

    data.invitedUsers.push(data.meetingDetails.ownerUID);

    await Promise.all(data.invitedUsers.map(async (uid) => {
        await db.collection('users_testing').doc(uid).collection('meetings').doc(querySnapshot.id).set(data.meetingDetails);

        await Promise.all(data.invitedUsers.map(async (uid1) => {
            var userSnapshot = await db.collection('users_testing').doc(uid1).get();
            await db.collection('users_testing').doc(uid).collection('meetings').doc(querySnapshot.id).collection('invitedUsers').doc(uid1).set({
                name: userSnapshot.data().name
            })
        }))
    }))
    res.send("Created New Meeting")
});

//Update a Meeting
router.put('/update/:id', async (req, res, next) =>{
    const ownerUID = 'asdjawdjawdg';
    const query = db.collection('users_testing').doc(ownerUID).collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let result = querySnapshot.data();
        console.log(result)
        // if(result.meetingDetails.ownerUID === "asdjawdjawdg"){
        //     const batch = db.batch();
        //
        //     const data = {
        //         meetingDetails: {
        //             time: req.body.time,
        //             ownerUID: req.body.ownerUID,
        //         }
        //     }
        //     const meetingRef = db.collection('meetings_testing').doc();
        //     batch.set(meetingRef ,data.meetingDetails)
        //
        //     const usersRef = db.collection('users_testing').doc(req.body.ownerUID).collection('meetings').doc(meetingRef.id)
        //     batch.set(usersRef, data.meetingDetails)
        //
        //     await Promise.all(
        //         req.body.invitedUsers.map(async (uid)=>{
        //             var userSnapshot = await db.collection('users_testing').doc(uid).get()
        //             const invitedUsersUCRef = db.collection('users_testing').doc(req.body.ownerUID).collection('meetings').doc(meetingRef.id).collection('invitedUsers').doc(uid)
        //             batch.set(invitedUsersUCRef, {name: userSnapshot.data().name})
        //             const invitedUsersMCRef = db.collection('meetings_testing').doc(meetingRef.id).collection('invitedUsers').doc(uid)
        //             batch.set(invitedUsersMCRef, {name: userSnapshot.data().name})
        //         })
        //     ).catch(()=>{
        //         res.send("Error inviting users")
        //     })
        //     await batch.commit();
        //     await db.collection('meetings_testing').doc(req.params.id).set(req.body)
        //     await db.collection('users_testing').doc('asdjawdjawdg').collection('meetings').doc(req.params.id).set(req.body)
        //     res.send('Meeting Updated!');
        // }else{
        //     res.send('Not Authorized to edit this meeting')
        // }
    }else{
        res.send('No Result Found')
    }
});

//Delete a Meeting
router.delete('/delete/:id', async (req, res, next) =>{
    await db.collection('meetings_testing').doc(req.params.id).delete()
    res.send('Meeting successfully deleted')
})

module.exports = router;
