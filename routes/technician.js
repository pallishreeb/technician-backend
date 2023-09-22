// Example routes/users.js
const express = require('express');
const { addTechnician, getTechnicians, updateTechnician, removeTechnician, bulkDeleteTechnicians,loginTechnician, technicianJobs, technicianTimelineDates } = require('../controllers/technicians');
const router = express.Router();
const {isAdmin, isAuthenticated} = require("../middleware")

// Define  routes here
router.post('/',isAdmin,addTechnician)
router.post('/login',loginTechnician)
router.get('/',isAdmin,getTechnicians)
router.get('/myjobs',isAuthenticated,technicianJobs)
router.get('/mydates',isAuthenticated,technicianTimelineDates)
router.put('/',isAdmin,updateTechnician)
router.delete('/',isAdmin,removeTechnician)
router.delete('/bulk-delete',isAdmin, bulkDeleteTechnicians)
module.exports = router;
