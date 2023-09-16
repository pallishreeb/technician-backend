// Example routes/users.js
const express = require('express');
const router = express.Router();
const {registerAdmin,loginAdmin,resetPassword} = require('../controllers/admin')


// Define  routes here
router.post('/',registerAdmin)
router.post('/login',loginAdmin)
router.put('/reset-password',resetPassword)

module.exports = router;