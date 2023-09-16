// Example routes/users.js
const express = require('express');
const { addJob, bulkDeleteJobs, removeJob, updateJob, getJobs, getJobFilter, updateStatus, jobDetail, filterJobByDate, timelineDates} = require('../controllers/jobs');
const router = express.Router();

const {isAdmin,isAuthenticated} = require("../middleware")

// Define  routes here
router.post('/',isAuthenticated,addJob)
router.get('/',isAuthenticated,getJobs)
router.get('/job-detail',isAuthenticated,jobDetail)
router.get('/analytics', isAuthenticated,getJobFilter)
router.get('/filter-by-date',isAuthenticated,filterJobByDate)
router.get('/timeline-dates',isAuthenticated,timelineDates)
router.put('/',isAuthenticated,updateJob)
router.put('/update-status',isAuthenticated,updateStatus)
router.delete('/',isAdmin,removeJob)
router.delete('/bulk-delete', isAdmin,bulkDeleteJobs)
module.exports = router;