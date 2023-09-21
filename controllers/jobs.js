const db = require("../db");

// Route to create a job
exports.addJob = async (req, res) => {
  db.getConnection(function (err, connection) {
    const {
      title,
      description,
      technician,
      apartment,
      status,
      timeline,
      note,
      imageUrl,
      responsibilities,
    } = req.body;

    // Basic validation
    if (!title || !apartment) {
      return res
        .status(400)
        .json({ message: "Job Title and Apartment fields are required" });
    }

    const insertQuery =
      "INSERT INTO jobs (title,description, technician, apartment, status,timeline,note,imageUrl, responsibilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    connection.query(
      insertQuery,
      [
        title,
        description,
        technician,
        apartment,
        status,
        timeline,
        note,
        imageUrl,
        JSON.stringify(responsibilities),
      ],
      (err, result) => {
        if (err) {
          console.error("Error creating job:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        // Get the inserted job ID
        const jobId = result.insertId;

        // Retrieve the inserted job data
        const selectJobQuery = "SELECT * FROM jobs WHERE id = ?";
        connection.query(selectJobQuery, [jobId], (err, job) => {
          if (err) {
            console.error("Error fetching the job: ", err);
            return res
              .status(500)
              .json({ message: "Error fetching the job data" });
          }

          res
            .status(201)
            .json({ message: "Job created successfully", job: job[0] });
          connection.release();
        });
      }
    );
  });
};

exports.getJobs = async (req, res) => {
  db.getConnection(function (err, connection) {
    // const query = 'SELECT * FROM jobs';
    const query = `
    SELECT 
      jobs.*, 
      technicians.name AS technician_name, 
      technicians.email AS technician_email, 
      apartments.apartmentName AS apartment_name, 
      apartments.location AS apartment_location
    FROM jobs
    LEFT JOIN technicians ON jobs.technician = technicians.id
    LEFT JOIN apartments ON jobs.apartment = apartments.id
    ORDER BY createdAt DESC
  `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching jobs:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      // console.log(results,"results------")
      res.json(results);
      connection.release();
    });
  });
};

exports.updateJob = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;
    const {
      title,
      description,
      technician,
      apartment,
      status,
      timeline,
      note,
      imageUrl,
      responsibilities,
    } = req.body;
    // Get the existing job data from the database
    const getJobQuery = "SELECT * FROM jobs WHERE id = ?";

    connection.query(getJobQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching job data: ", err);
        return res.status(500).json({ message: "Error fetching job data" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      // const existingJobData = results[0];
      const updatedJobData = {
        title,
        description,
        technician,
        apartment,
        status,
        timeline,
        note,
        imageUrl,
        responsibilities: JSON.stringify(responsibilities),
      };
      // Generate the SQL UPDATE query based on the provided fields
      const updateFields = {};
      for (const key in updatedJobData) {
        if (updatedJobData[key] !== undefined) {
          updateFields[key] = updatedJobData[key];
        }
      }

      // Update the job data in the database
      const updateJobQuery = "UPDATE jobs SET ? WHERE id = ?";
      // const updateQuery = 'UPDATE jobs SET title=?, technician=?, apartment=?, status=?, timeline=? WHERE id=?';

      connection.query(updateJobQuery, [updateFields, id], (err, result) => {
        if (err) {
          console.error("Error updating job:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        res.json({ message: "Job updated successfully", result });
        connection.release();
      });
    });
  });
};

exports.removeJob = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;

    const deleteQuery = "DELETE FROM jobs WHERE id=?";

    connection.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Error deleting job:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({ message: "Job deleted successfully", result });
      connection.release();
    });
  });
};

exports.bulkDeleteJobs = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty IDs array" });
    }

    const deleteQuery = "DELETE FROM jobs WHERE id IN (?)";

    connection.query(deleteQuery, [ids], (err, result) => {
      if (err) {
        console.error("Error bulk deleting jobs:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({ message: "Jobs bulk deleted successfully", result });
      connection.release();
    });
  });
};

exports.getJobFilter = async (req, res) => {
  db.getConnection(function (err, connection) {
    const statisticsQuery = `
    SELECT
      COUNT(*) AS totalNoJobs,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) AS totalNoJobsAssigned,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS totalNoJobsCompleted,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS totalNoJobsPending,
      SUM(CASE WHEN status = 'not assigned' THEN 1 ELSE 0 END) AS totalNoJobsUnassigned
    FROM jobs
  `;

    connection.query(statisticsQuery, (err, result) => {
      if (err) {
        console.error("Error fetching job statistics:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      // The result will contain the requested statistics
      if (result && result[0]) {
        const statistics = {
          totalNoJobs: result[0].totalNoJobs,
          totalNoJobsAssigned: result[0].totalNoJobsAssigned,
          totalNoJobsCompleted: result[0].totalNoJobsCompleted,
          totalNoJobsPending: result[0].totalNoJobsPending,
          totalNoJobsUnassigned: result[0].totalNoJobsUnassigned,
        };
        res.json(statistics);
      } else {
        res.json({});
      }
      connection.release();
    });
  });
};

exports.updateStatus = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Update the job status in the database
    const updateJobStatusQuery = "UPDATE jobs SET status = ? WHERE id = ?";

    connection.query(updateJobStatusQuery, [status, id], (err, results) => {
      if (err) {
        console.error("Error updating job status: ", err);
        return res.status(500).json({ message: "Error updating job status" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.status(200).json({ message: "Job status updated successfully" });
      connection.release();
    });
  });
};

exports.filterJobByDate = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // SQL query to retrieve jobs with a specific timeline date
    const getJobsByDateQuery = "SELECT * FROM jobs WHERE timeline = ?";

    connection.query(getJobsByDateQuery, [date], (err, results) => {
      if (err) {
        console.error("Error fetching jobs by date: ", err);
        return res.status(500).json({ message: "Error fetching jobs by date" });
      }

      res.status(200).json(results);
      connection.release();
    });
  });
};

exports.jobDetail = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;
    // SQL query to retrieve a job by its ID

    const getJobByIdQuery = 
    `SELECT
       jobs.*,
       technicians.name AS technician_name, 
       technicians.email AS technician_email, 
       apartments.apartmentName AS apartment_name, 
       apartments.location AS apartment_location
    FROM
      jobs
    INNER JOIN
      technicians ON jobs.technician = technicians.id
    INNER JOIN
      apartments ON jobs.apartment = apartments.id
    WHERE
      jobs.id = ?`;

    connection.query(getJobByIdQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching job by ID: ", err);
        return res.status(500).json({ message: "Error fetching job by ID" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const job = results[0];

      res.status(200).json(job);
      connection.release();
    });
  });
};

exports.timelineDates = async (req, res) => {
  db.getConnection(function (err, connection) {
    // SQL query to select all distinct timeline dates
    const getTimelineDatesQuery =
      "SELECT DISTINCT timeline AS timelineDate FROM jobs";

    connection.query(getTimelineDatesQuery, (err, results) => {
      if (err) {
        console.error("Error fetching timeline dates: ", err);
        return res
          .status(500)
          .json({ message: "Error fetching timeline dates" });
      }

      // Extract the timeline dates from the results
      const timelineDates = results.map((row) => row.timelineDate);

      res.status(200).json(timelineDates);
      connection.release();
    });
  });
};
