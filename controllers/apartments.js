const db = require("../db");

exports.addApartment = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { apartmentName, location } = req.body;

    // Basic validation
    if (!apartmentName || !location) {
      return res
        .status(400)
        .json({ message: "Apartment name and location are required" });
    }

    const insertQuery =
      "INSERT INTO apartments (apartmentName, location) VALUES (?, ?)";

    connection.query(insertQuery, [apartmentName, location], (err, result) => {
      if (err) {
        console.error("Error adding apartment:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({ message: "Apartment added successfully", result });
      connection.release();
    });
  });
};

exports.getApartments = async (req, res) => {
  db.getConnection(function (err, connection) {
    const query = "SELECT * FROM apartments ORDER BY id DESC";

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching apartments:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json(results);
      connection.release();
    });
  });
};

exports.updateApartment = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;
    const { apartmentName, location } = req.body;

    // Basic validation
    if (!apartmentName || !location) {
      return res
        .status(400)
        .json({ message: "Apartment name and location are required" });
    }

    const updateQuery =
      "UPDATE apartments SET apartmentName=?, location=? WHERE id=?";

    connection.query(
      updateQuery,
      [apartmentName, location, id],
      (err, result) => {
        if (err) {
          console.error("Error updating apartment:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        res.json({ message: "Apartment updated successfully", result });
        connection.release();
      }
    );
  });
};

exports.removeApartment = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { id } = req.query;

    const deleteQuery = "DELETE FROM apartments WHERE id=?";
    const linkedQuery =
      "SELECT COUNT(*) AS count FROM jobs WHERE apartment = ?";
    connection.query(linkedQuery, [id], (err, results) => {
      if (err) {
        console.error("Error checking linked records:", err);
        return res
          .status(500)
          .json({ message: "Error checking linked records" });
        // Handle the error as needed
      } else {
        const linkedRecordCount = results[0].count;

        // If there are linked records, prevent deletion and send an error message
        if (linkedRecordCount > 0) {
          res
            .status(400)
            .json({
              message: "Cannot delete; record is linked in another table.",
            });
        } else {
          connection.query(deleteQuery, [id], (err, result) => {
            if (err) {
              console.error("Error deleting apartment:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            res.json({ message: "Apartment deleted successfully", result });
            connection.release();
          });
        }
      }
    });
  });
};

exports.bulkDeleteApartments = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty IDs array" });
    }

    const deleteQuery = "DELETE FROM apartments WHERE id IN (?)";

    connection.query(deleteQuery, [ids], (err, result) => {
      if (err) {
        console.error("Error bulk deleting apartments:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({ message: "Apartments bulk deleted successfully", result });
      connection.release();
    });
  });
};
