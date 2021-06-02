var express = require('express');
const firebase = require('../db');

var router = express.Router();

/* GET users listing. */
router.get('/', async (req, res, next) => {

  const snapshot = await firebase.collection('testing_collection').get();
  var content = "";
  snapshot.forEach((doc) => {
    content += `${doc.id} \n ${doc.some_content} \t`;
  });

  res.send(content);
});

router.get('/insert', async (req, res, next) => {

  const docRef = firebase.collection('testing_collection').doc('new_document');

  await docRef.set({
    some_content: 'Ada',
    other_content: 'Lovelace',
    born: 1815
  });

  res.send('Created document')
});

module.exports = router;
