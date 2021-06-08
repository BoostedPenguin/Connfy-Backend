var express  = require('express')
const db = require('../db')
var router = express.Router()
var checkIfAuthenticated = require('../middlewares/authentication_middleware');

//Get All Meetings
router.get('/', checkIfAuthenticated, async (req, res, next) => {
    const query = db.collection('users_testing').doc(req.authId).collection('meetings');
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
router.get('/:id', checkIfAuthenticated, async (req, res, next) => {
    const query = db.collection('users_testing').doc(req.authId).collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();
    const query1 = db.collection('users_testing').doc(req.authId).collection('meetings').doc(req.params.id).collection('invitedUsers');
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
        if(data.invitedUsers.includes(req.authId) || data.meetingData.ownerUID === req.authId){
            res.send(data)
        }else{
            res.send('Not Authorized to access this meeting')
        }
    }else{
            res.send('No Result Found')
        }
});

//Adding a new Meeting
router.post('/add', checkIfAuthenticated, async (req, res, next) => {
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
router.put('/update/:id', checkIfAuthenticated, async (req, res, next) =>{
    const query = db.collection('users_testing').doc(req.authId).collection('meetings').doc(req.params.id);
    const querySnapshot = await query.get();

    if(querySnapshot.exists){
        let result = querySnapshot.data();

        if(result.ownerUID === req.authId){
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
           await db.collection('meetings_testing').doc(req.params.id).set(data.meetingDetails)

            await Promise.all(data.invitedUsers.map(async (uid) => {
                var userSnapshot = await db.collection('users_testing').doc(uid).get()
                await db.collection('meetings_testing').doc(req.params.id).collection('invitedUsers').doc(uid).set({name:userSnapshot.data().name})
            }))

            data.invitedUsers.push(data.meetingDetails.ownerUID);

            await Promise.all(data.invitedUsers.map(async (uid) => {
                await db.collection('users_testing').doc(uid).collection('meetings').doc(req.params.id).set(data.meetingDetails);

                await Promise.all(data.invitedUsers.map(async (uid1) => {
                    var userSnapshot = await db.collection('users_testing').doc(uid1).get();
                    await db.collection('users_testing').doc(uid).collection('meetings').doc(req.params.id).collection('invitedUsers').doc(uid1).set({
                        name: userSnapshot.data().name
                    })
                }))
            }))
            res.send('Meeting Updated!')
        }else{
            res.send('Not Authorized to modify this meeting')
        }
    }else{
        res.send('No Result Found')
    }
});

//Delete a Meeting
router.delete('/delete/:id', async (req, res, next) =>{
    // const userMeetingsSnapshot = await db.collection('meetings_testing').doc(req.params.id).collection('invitedUsers').get()
    // await Promise.all(
    //     userMeetingsSnapshot.forEach(async (uid)=>{
    //         await deleteCollection(db.collection('users_testing').doc(uid.id).collection('meetings').doc(req.params.id).collection('invitedUsers'), 15)
    //         await db.collection('users_testing').doc(uid.id).collection('meetings').doc(req.params.id).delete()
    //     })
    // )
    // await deleteCollection(db.collection('meetings_testing').doc(req.params.id).collection('invitedUsers'), 15)
    // await db.collection('meetings_testing').doc(req.params.id).delete()
    // await deleteCollection(db.collection('users_testing').doc(req.params.id).collection('invitedUsers'), 15)
    // await db.collection('meetings_testing').doc(req.params.id).delete()
})

async function deleteCollection(collectionRef, batchSize) {

    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

module.exports = router;
