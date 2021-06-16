const express = require('express');
const db = require('../db');
const admin = require('firebase-admin');
const checkIfAuthenticated = require('../middlewares/authentication_middleware');
const router = express.Router();

//Adding a note
router.post('/add', checkIfAuthenticated, async (req, res, next) => {
	const data = {
		notesDetails: {
			meetingUID: req.body.meetingUID,
			text: req.body.text,
			date: admin.firestore.Timestamp.fromMillis(req.body.date)
		}
	};
	const notesQuerySnapshot = await db.collection('notes').add(data.notesDetails);
	if (await addUsers(data.notesDetails.meetingUID, notesQuerySnapshot.id)) {
		await db
			.collection('meetings')
			.doc(data.notesDetails.meetingUID)
			.update({ notes: admin.firestore.FieldValue.arrayUnion(notesQuerySnapshot.id) });
		await getNotes(req, res, notesQuerySnapshot.id);
	} else {
		await db.collection('notes').add(data.notesDetails);
		res.send('Error while adding a note').status(500);
	}
});
