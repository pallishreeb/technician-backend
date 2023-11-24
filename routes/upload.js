const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { isAuthenticated } = require("../middleware");
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
router.patch("/update-images", isAuthenticated, upload.array("images", 3), (req, res) => {
  const { jobId } = req.query;
  let images = [];
  if (req.files && req.files.length > 0) {
    for (var i = 0; i < req.files.length; i++) {
      images.push(req.files[i].filename);
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
          return res.status(404).json({ message: "Job not found" });
        }

        const existingImageUrls = existingData[0].imageUrls || [];
        const existingImageArray = Array.isArray(existingImageUrls)
          ? existingImageUrls
          : [existingImageUrls];

        const newImageUrls = existingImageArray.concat(images);

        const imageUrlsString = newImageUrls.join(",");
        
        // Update the job record with the new image URLs
        connection.query(
          "UPDATE jobs SET imageUrls = ? WHERE id = ?",
          [imageUrlsString, jobId],
          (err, results) => {
            if (err) {
              console.error("Error updating job:", err);
              connection.release();
              return res.status(500).json({ message: "Internal server error" });
            }

            connection.release();
            res.status(200).json({ message: "Images updated successfully", newImageUrls });
          }
        );
      }
    );
  });
});

// API endpoint to get images for a specific job
router.get("/get-images", isAuthenticated, async (req, res) => {
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
   
         let imageUrls = jobData[0].imageUrls;
   
         // Check if imageUrls is a string before splitting
         if (typeof imageUrls === 'string') {
            // Split the comma-separated string into an array
            imageUrls = imageUrls.split(',');
         } else {
            // Handle the case where imageUrls is not a string (you might want to log a warning or handle it differently)
            console.warn("Image URLs are not in the expected format.");
            // Set imageUrls to an empty array or handle it based on your use case
            imageUrls = [];
         }
   
         connection.release();
         // Send the image URLs as a response
         res.status(200).json({ imageUrls });
      }
   );
  });
});

// API endpoint to delete an image for a specific job by jobId
router.delete("/delete-image", isAuthenticated, async (req, res) => {
  try {
    const { jobId, imageName } = req.query;

    db.getConnection(function (err, connection) {
      // Fetch the current image URLs for the job with the provided ID from your database
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

          const currentImageUrls = jobData[0].imageUrls || "";
          
          // Remove the specific image URL from the comma-separated list
          const updatedImageUrls = currentImageUrls
            .split(",")
            .filter(url => url !== imageName)
            .join(",");

          // Update the job record in the database with the updated imageUrls
          connection.query(
            "UPDATE jobs SET imageUrls = ? WHERE id = ?",
            [updatedImageUrls, jobId],
            (err, result) => {
              if (err) {
                console.error("Error updating job:", err);
                connection.release();
                return res.status(500).json({ message: "Internal server error" });
              }

              // Delete the image file from the "uploads" directory
              const uploadsDir = path.join(__dirname, "..", "uploads");
              const imagePath = path.join(uploadsDir, imageName);
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
