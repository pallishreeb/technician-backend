const db = require("../db");
const jwt = require("jsonwebtoken");
exports.addTechnician = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      connection.release();
      return res.status(400).json({ message: "All fields are required" });
    }

    let technicianQuery = "SELECT * FROM technicians WHERE email=?";
    connection.query(technicianQuery, [email], (err, result) => {
      if (result.length > 0 && result[0].email == email) {
        connection.release();
        return res
          .status(400)
          .json({ message: "Technician with this email already exist" });
      }
      // Insert the technician into the database
      const insertQuery =
        "INSERT INTO technicians (name, email, password) VALUES (?, ?, ?)";
      connection.query(insertQuery, [name, email, password], (err, result) => {
        if (err) {
          console.error("Error inserting technician:", err);
          connection.release();
          return res.status(500).json({ message: "Internal server error" });
        }
        console.log("Technician added:", result);
        connection.release();
        res
          .status(201)
          .json({ message: "Technician added successfully", result });

      });
    });
  });
};

exports.getTechnicians = async (req, res) => {
  db.getConnection(function (err, connection) {
    const query = "SELECT * FROM technicians ORDER BY id DESC";

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching technicians:", err);
        connection.release();
        return res.status(500).json({ message: "Internal server error" });
      }
      connection.release();
      res.json(results);
    });
  });
};

exports.updateTechnician = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      connection.release();
      return res.status(400).json({ message: "All fields are required" });
    }

    const updateQuery =
      "UPDATE technicians SET name=?, email=?, password=? WHERE id=?";

    connection.query(
      updateQuery,
      [name, email, password, id],
      (err, result) => {
        if (err) {
          console.error("Error updating technician:", err);
          connection.release();
          return res.status(500).json({ message: "Internal server error" });
        }
        connection.release();
        res.json({ message: "Technician updated successfully", result });
      }
    );
  });
};

exports.removeTechnician = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;

    const deleteQuery = "DELETE FROM technicians WHERE id=?";
    const linkedQuery =
      "SELECT COUNT(*) AS count FROM jobs WHERE technician = ?";
    connection.query(linkedQuery, [id], (err, results) => {
      if (err) {
        console.error("Error checking linked records:", err);
        connection.release();
        return res
          .status(500)
          .json({ message: "Error checking linked records" });
        // Handle the error as needed
      } else {
        const linkedRecordCount = results[0].count;

        // If there are linked records, prevent deletion and send an error message
        if (linkedRecordCount > 0) {
          connection.release();
          res.status(400).json({
            message: "Cannot delete; record is linked in another table.",
          });
        } else {
          connection.query(deleteQuery, [id], (err, result) => {
            if (err) {
              console.error("Error deleting technician:", err);
              connection.release();
              return res.status(500).json({ message: "Internal server error" });
            }
            connection.release();
            res.json({ message: "Technician deleted successfully", result });
          });
        }
      }
    });
  });
};

exports.bulkDeleteTechnicians = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      connection.release();
      return res.status(400).json({ message: "Invalid or empty IDs array" });
    }

    const deleteQuery = "DELETE FROM technicians WHERE id IN (?)";

    connection.query(deleteQuery, [ids], (err, result) => {
      if (err) {
        console.error("Error bulk deleting technicians:", err);
        connection.release();
        return res.status(500).json({ message: "Internal server error" });
      }
      connection.release();
      res.json({ message: "Technicians bulk deleted successfully", result });
    });
  });
};

exports.loginTechnician = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      connection.release();
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const selectQuery = "SELECT * FROM technicians WHERE email = ?";

    connection.query(selectQuery, [email], async (err, results) => {
      if (err) {
        console.error("Error logging in:", err);
        connection.release();
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        connection.release();
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const technician = results[0];

      // Compare the provided password with the  password in the database

      if (password !== technician.password) {
        connection.release();
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // Create a JWT token
      const token = jwt.sign(
        { id: technician.id, email: technician.email },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "2d", // Token expiration time (adjust as needed)
        }
      );
      connection.release();
      res.json({
        message: "Technician logged in successfully",
        technician,
        token,
      });
    });
  });
};

exports.technicianJobs = async (req,res) =>{
  db.getConnection(function (err, connection) {
  const technicianId = req.query.technicianId;

  // Basic input validation
  if (!technicianId || isNaN(technicianId)) {
    connection.release();
    return res.status(400).json({ error: 'Invalid technicianId' });
  }

  // Create the SQL query to fetch jobs and join with technician details
  const query = `
    SELECT jobs.*, technicians.name, technicians.email
    FROM jobs
    INNER JOIN technicians ON jobs.technician = technicians.id
    WHERE jobs.technician = ? 
    ORDER BY priority DESC, createdAt DESC
  `;

  // Execute the query
  db.query(query, [technicianId], (err, results) => {
    if (err) {
      console.error('Database error: ' + err);
      connection.release();
      return res.status(500).json({ error: 'Database error' });
    }
    connection.release();
    res.json(results);
  });
})
}

exports.technicianTimelineDates = async (req, res) => {
  db.getConnection(function (err, connection) {
    const {technicianId,month , year} = req.query;
    // SQL query to select all distinct timeline dates
     const getTimelineDatesQuery =
      `SELECT DISTINCT timeline AS timelineDate FROM jobs 
      WHERE 
         MONTH(STR_TO_DATE(timeline, '%d-%m-%Y')) = ?
         AND YEAR(STR_TO_DATE(timeline, '%d-%m-%Y')) = ?
         AND jobs.technician = ?`;

    connection.query(getTimelineDatesQuery,[month , year,technicianId], (err, results) => {
      if (err) {
        console.error("Error fetching timeline dates: ", err);
        connection.release();
        return res
          .status(500)
          .json({ message: "Error fetching timeline dates" });
      }

      // Extract the timeline dates from the results
      const timelineDates = results.map((row) => row.timelineDate);
      connection.release();
      res.status(200).json(timelineDates);
    });
  });
};