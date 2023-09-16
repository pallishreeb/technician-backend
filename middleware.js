const db = require("./db");
const jwt = require("jsonwebtoken");
// Middleware function to check if a user is authenticated
exports.isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization; // Send the token  in the "Authorization" header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Decoded data from the token is now available in "decoded"
    //take email from decoded
    const email = decoded.email;
    db.getConnection(function (err, connection) {
      // Query the technician table to find the email
      const findTechnicianQuery =
        "SELECT email FROM technicians WHERE email = ?";

      // Query the admin table to find the email
      const findAdminQuery = "SELECT email FROM admin WHERE email = ?";

      // Perform parallel queries using Promise.all
      Promise.all([
        new Promise((resolve, reject) => {
          connection.query(findTechnicianQuery, [email], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results.length > 0);
            }
          });
        }),
        new Promise((resolve, reject) => {
          connection.query(findAdminQuery, [email], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results.length > 0);
            }
          });
        }),
      ])
        .then(([technicianFound, adminFound]) => {
          if (technicianFound || adminFound) {
            // Email is valid, proceed to the next middleware or route
            req.user = decoded;
            // Continue to the next middleware or route
            next();
          } else {
            // Email not found in both tables, send unauthorized response
            res.status(401).json({ message: "Unauthorized" });
          }
        })
        .catch((err) => {
          console.error("Error checking email in authentication: ", err);
          res.status(500).json({ message: "Internal server error" });
        });
      connection.release();
    });
  });
};
// Middleware function to check if a user is authenticated and admin or not
exports.isAdmin = (req, res, next) => {
  // const email = req.headers.email;
  const token = req.headers.authorization; // Assuming the token is in the "Authorization" header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const email = decoded.email;
    db.getConnection(function (err, connection) {
      // SQL query to check if the email is present in the admin table
      const checkEmailQuery = "SELECT * FROM admin WHERE email = ?";

      connection.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
          console.error("Error checking email: ", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
          // Email not found in the admin table
          return res.status(401).json({ message: "Unauthorized" });
        }
        // Decoded data from the token is now available in "decoded"
        req.user = decoded;
        // Email is Admin's email
        next();
      });
      connection.release();
    });
  });
};
