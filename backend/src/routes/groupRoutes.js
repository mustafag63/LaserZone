const express = require('express');
const router  = express.Router();
const {
  create,
  listOpen,
  listMine,
  getOne,
  update,
  cancel,
  submitJoinRequest,
  submitLeaveRequest,
  listJoinRequests,
  respondToRequest,
  respondToLeaveRequest,
  removeMember,
  listMyRequests,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                              protect, create);
router.get('/',                               protect, listOpen);
router.get('/my',                             protect, listMine);
router.get('/my-requests',                    protect, listMyRequests);
router.get('/:id',                            protect, getOne);
router.put('/:id',                            protect, update);
router.delete('/:id',                         protect, cancel);
router.post('/:id/join',                      protect, submitJoinRequest);
router.post('/:id/leave',                     protect, submitLeaveRequest);
router.get('/:id/requests',                   protect, listJoinRequests);
router.put('/:id/requests/:requestId',        protect, respondToRequest);
router.put('/:id/leave-requests/:requestId',  protect, respondToLeaveRequest);
router.delete('/:id/members/:userId',         protect, removeMember);

module.exports = router;
