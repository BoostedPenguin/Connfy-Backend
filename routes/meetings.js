var express  = require('express')
const db = require('../db')
var router = express.Router()

//Get All Meetings
router.get('/', async (req, res, next) => {
    const query = db.collection('meetings_testing');
    const querySnapshot = await query.get();

    let result = [];

    if(querySnapshot.size > 0){
        querySnapshot.forEach(doc =>{
            console.log(doc.data());
            result.push(doc.data());
        });
        res.send(result);
    }else{
        res.send('No Result Found')
    }
});

//Get Meeting by ID
router.get('/:id', async (req, res, next) => {
    const query = db.collection('meetings_testing').doc(req.params.id);
    const querySnapshot = await query.get();

    let result;

    if(querySnapshot.exists){
        result = querySnapshot.data();
        console.log(result);
        res.send(result);
    }else{
        res.send('No Result Found')
    }
});

//Add New Meeting
router.post('/add', async (req, res, next) => {
    await db.collection('meetings_testing').doc(req.params.id).set(req.params)
});

//Update a Meeting
router.put('/update/:id', async (req, res, next) =>{
    const query = db.collection('meetings_testing').doc(req.params.id);
    const querySnapshot = await query.get();
    
    if(querySnapshot.exists){
        await db.collection('meetings_testing').doc(req.params.id).set(req.params)
        res.send('Meeting updated')
    }else{
        res.send('No Such Meeting')
    }
});

//Delete a Meeting
router.delete('delete/:id', async (req, res, next) =>{
    await db.collection('meetings_testing').doc(req.params.id).delete()
    res.send('Meeting successfully deleted')
})

module.exports = router;
