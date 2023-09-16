const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    let adminQuery = "SELECT * FROM admin WHERE email=?";
    connection.query(adminQuery, [email], async (err, result) => {
      if (result.length > 0 && result[0].email == email) {
        return res
          .status(400)
          .json({ message: "Admin with this email already exist" });
      }

      // Hash the password before storing it in the database
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = "INSERT INTO admin (email, password) VALUES (?, ?)";

      connection.query(insertQuery, [email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error registering admin:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        res.json({ message: "Admin registered successfully" });
        connection.release();
      });
    });
  });
};

exports.loginAdmin = async (req, res) => {
  db.getConnection(function (err, connection) {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const selectQuery = "SELECT * FROM admin WHERE email = ?";

    connection.query(selectQuery, [email], async (err, results) => {
      if (err) {
        console.error("Error logging in:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const admin = results[0];

      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // Create a JWT token
      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "2d", // Token expiration time (adjust as needed)
        }
      );
      res.json({ message: "Admin logged in successfully", admin, token });
      connection.release();
    });
  });
};

exports.resetPassword = async (req, res) => {
  db.getConnection(async function (err, connection) {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateQuery = "UPDATE admin SET password=? WHERE email=?";

    connection.query(updateQuery, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error("Error Reseting password:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({ message: "Password updated successfully" });
      connection.release();
    });
  });
};
