const express = require('express');
const { getMemberDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/member', authenticate, getMemberDashboard);
router.get('/admin', authenticate, authorizeAdmin, getAdminDashboard);

module.exports = router;
