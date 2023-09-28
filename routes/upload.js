const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../db");
const {isAuthenticated} = require("../middleware")
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// API endpoint to handle file uploads and data insertion
router.patch("/update-images",isAuthenticated, upload.array("images", 3), (req, res) => {
  const { jobId } = req.query;
  // const images = req.files.map((file) => file.filename).join(",");
  let images = []
  if (req.files && req.files.length > 0) {
    for (var i = 0; i < req.files.length; i++) {
      images.push(req.files[i].filename)
    }
  }
  db.getConnection(function (err, connection) {
    // First, check if the job exists
    connection.query(
      "SELECT imageUrls FROM jobs WHERE id = ?",
      [jobId],
      (err, existingData) => {
        if (err) {
          console.error("Error getting job:", err);
          connection.release();
          return res.status(500).json({ message: "Internal server error" });
        }
        if (existingData.length === 0) {
          connection.release();
          return Promise.reject({ status: 404, message: "Job not found" });
        }

        const existingImageUrls = existingData[0].imageUrls || [];
        const newImageUrls = existingImageUrls.concat(images);

        // Update the job record with the new image URLs
        connection.query(
          "UPDATE jobs SET imageUrls = ? WHERE id = ?",
          [JSON.stringify(newImageUrls), jobId],
          (err, results) => {
            connection.release();
            res.status(200).json({ message: "Images updated successfully" });
          }
        );
      }
    );
  });
});
// API endpoint to get images for a specific job
router.get("/get-images",isAuthenticated, async (req, res) => {
  const { jobId } = req.query;
  db.getConnection(function (err, connection) {
    // Fetch the image URLs for the job with the provided ID from your database
    connection.query(
      "SELECT imageUrls FROM jobs WHERE id = ?",
      [jobId],
      (err, jobData) => {
        if (err) {
          console.error("Error getting job:", err);
          connection.release();
          return res.status(500).json({ message: "Internal server error" });
        }
        if (!jobData || jobData.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Job not found" });
        }
        //   console.log("jobData",jobData)

        let imageUrls = jobData[0].imageUrls || [];
        connection.release();
        // Send the image URLs as a response
        res.status(200).json({ imageUrls });
      }
    );
  });
});

// API endpoint to delete an image for a specific job by jobId
router.delete("/delete-image",isAuthenticated, async (req, res) => {
  try {
    const { jobId, imageName } = req.query;

    db.getConnection(function (err, connection) {
      // Fetch the image URLs for the job with the provided ID from your database
      connection.query(
        "SELECT imageUrls FROM jobs WHERE id = ?",
        [jobId],
        (err, jobData) => {
            if (err) {
                console.error("Error getting job:", err);
                connection.release();
                return res.status(500).json({ message: "Internal server error" });
              }
          if (!jobData || jobData.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Job not found" });
          }

          let imageUrls = jobData[0].imageUrls || [];

          // Find the index of the image to delete in the array
          const indexToDelete = imageUrls?.findIndex((url) => url === imageName);

          if (indexToDelete === -1) {
            connection.release();
            return res
              .status(404)
              .json({ message: "Image not found for the given jobId" });
          }

          // Remove the image URL from the array
          imageUrls.splice(indexToDelete, 1);
          // Update the job record in the database with the updated imageUrls
          connection.query(
            "UPDATE jobs SET imageUrls = ? WHERE id = ?",
            [JSON.stringify(imageUrls), jobId],
            (err, result) => {
              // Delete the image file from the "uploads" directory
           // Construct the absolute path to the "uploads" directory
           const uploadsDir = path.join(__dirname, '..', 'uploads');

           // Construct the absolute path to the image file
           const imagePath = path.join(uploadsDir, imageName);
           // Delete the image file from the "uploads" directory
           fs.unlinkSync(imagePath); // Delete the file
           connection.release();
        res.status(200).json({ message: "Image deleted successfully" });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
