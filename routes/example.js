var express = require('express');
const db = require('../db');
const checkIfAuthenticated = require('../middlewares/authentication_middleware')
const admin = require('firebase-admin');
var router = express.Router();

// Pre-populate database
router.get('/', async (req, res, next) => {

  // Pre defined users
  const userUID = "asdjawdjawdg"
  const user1 = {
    name: "First person",
    hasOutlook: true,
    date: admin.firestore.FieldValue.serverTimestamp()
  }

  const user2UID = "rgasdasdzas"
  const user2 = {
    name: "Second person",
    hasOutlook: true,
    date: admin.firestore.FieldValue.serverTimestamp()
  }

  const user3UID = "hcvbsdfyjrt"
  const user3 = {
    name: "Third person",
    hasOutlook: true,
    date: admin.firestore.FieldValue.serverTimestamp()
  }

  const coords = new admin.firestore.GeoPoint(51.4701422,5.4174171)

  // Delete existing collections
  await deleteCollection(db, "users_testing", 15)
  await deleteCollection(db, "meetings_testing", 15)
  
  // Add users and keep reference
  const batch = db.batch();
  const user1Ref = db.collection('users_testing').doc(userUID);
  batch.set(user1Ref, user1);

  const user2Ref = db.collection('users_testing').doc(user2UID);
  batch.set(user2Ref, user2);

  const user3Ref = db.collection('users_testing').doc(user3UID);
  batch.set(user3Ref, user3);


  await batch.commit()


  res.send("Works")
});


// Create meeting and invite users
router.get('/create', async (req, res, next) => {

  // Get user id from call
  // const userUID = req.authId
  const userUID = "asdjawdjawdg"

  // Meeting details (POST Data)
  const coords = new admin.firestore.GeoPoint(51.4701422,5.4174171)
  const data = {
    invitedUsers: [
      "rgasdasdzas",
      "hcvbsdfyjrt",
    ],
    meetingDetails: {
      time: "Sometime",
      ownerUID: userUID,
      geolocation: [
        {
          coords
        }
      ]
    }
  }

  var ownerRef = await db.collection('users_testing').doc(userUID).get()

  if(!ownerRef.exists) {
    return res.send("No person information")
  }


  // Create meeting details
  const meeting = {
    time: "Sometime",
    ownerUID: userUID,
    ownerName: ownerRef.data().name,
    geolocation: [
      {
        coords
      }
    ]
  }
  var ref = await db.collection('meetings_testing').add(meeting);


  const userInvites = db.batch()

  // Add invited users to meeting
  await Promise.all(data.invitedUsers.map(async (user) => {
    var snapshotUser = await db.collection('users_testing').doc(user).get()
    userInvites.set(db.collection('meetings_testing').doc(ref.id).collection('invitedUsers').doc(user), {name: snapshotUser.data().name})
  }))


  // Add calling user to invited user list
  data.invitedUsers.push(userUID)

  // Add meetings (w/invited users) to users
  await Promise.all(data.invitedUsers.map(async (user) => {
    userInvites.set(db.collection('users_testing').doc(user).collection('meetings').doc(ref.id), {
      ownerUID: meeting.ownerUID,
      ownerName: meeting.ownerName,
      time: meeting.time,
      geolocation: meeting.geolocation,
    })

    await Promise.all(data.invitedUsers.map(async (innerUser) => {
      var snapshotUser = await db.collection('users_testing').doc(innerUser).get()
      userInvites.set(db.collection('users_testing').doc(user).collection('meetings').doc(ref.id).collection('invitedUsers').doc(innerUser), {
        name: snapshotUser.data().name
      })
    }))
  }))


  await userInvites.commit();



  res.send('Created document')
});


// Get user information by UID
router.get('/get/:name', async (req, res, next) => {

  const doc = await db.collection('users_testing').doc(req.params.name).get()
  if (!doc.exists) {
    res.send("No")
  } else {
    res.send(`<p>${doc.data().name}</p><p>${doc.data().date.toDate()}</p><p>${doc.data().hasOutlook}</p>`)
  }
});


router.get('/insert', async (req, res, next) => {

  const docRef = db.collection('testing_collection').doc('new_document');

  await docRef.set({
    some_content: 'Ada',
    other_content: 'Lovelace',
    born: 1815
  });

  res.send('Created document')
});

// Example for authenticated accounts route only
router.get('/logged', checkIfAuthenticated, async (req, res, next) => {
  console.log(req.uid)
  // Uid -> meeting -> people
  return res.send("Logged");
})



async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
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
    deleteQueryBatch(db, query, resolve);
  });
}

module.exports = router;
