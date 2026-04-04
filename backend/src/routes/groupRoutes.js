const express = require('express');
const router  = express.Router();
const { create, listOpen, listMine, getOne, cancel } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',        protect, create);
router.get('/',         protect, listOpen);
router.get('/my',       protect, listMine);
router.get('/:id',      protect, getOne);
router.delete('/:id',   protect, cancel);

module.exports = router;
