const express = require('express');
const router = express.Router();
const {
    getAllLoans,
    getLoanById,
    getLoansByMember,
    createLoan,
    returnLoan,
} = require('../controllers/loanController');

// IMPORTANT: specific route /member/:memberId must be defined BEFORE /:id
// to prevent Express treating "member" as an ObjectId
router.get('/member/:memberId', getLoansByMember);

router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.post('/', createLoan);
router.put('/:id/return', returnLoan);

module.exports = router;
