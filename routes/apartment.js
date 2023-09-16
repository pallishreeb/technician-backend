// Example routes/users.js
const express = require('express');
const { addApartment, getApartments, updateApartment, removeApartment, bulkDeleteApartments } = require('../controllers/apartments');
const router = express.Router();
const {isAdmin,isAuthenticated} = require("../middleware")


// Define  routes here
router.post('/', isAdmin, addApartment)
router.get('/',isAuthenticated,getApartments)
router.put('/',isAdmin,updateApartment)
router.delete('/',isAdmin,removeApartment)
router.delete('/bulk-delete', isAdmin,bulkDeleteApartments)
module.exports = router;