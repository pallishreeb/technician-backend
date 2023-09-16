const mysql = require('mysql2');

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "developer",
  password: "password",
  port: 3306,
  database: "technician",
  connectionLimit: 10, // Adjust as needed
});

// You don't need the connection.connect() part when using a pool

module.exports = pool;

