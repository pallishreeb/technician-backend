const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "developer",
  password: "password",
  port: 3306,
  database: "technician",
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

module.exports = connection;


db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
  // Create the technicians table if it doesn't exist
  const createTableQuery = `
CREATE TABLE IF NOT EXISTS technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
)`;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating technicians table:", err);
      return;
    }
    console.log("Technicians table created");
  });
});

// Inside your MySQL connection setup
const createApartmentsTableQuery = `
CREATE TABLE IF NOT EXISTS apartments (
id INT AUTO_INCREMENT PRIMARY KEY,
apartmentName VARCHAR(255) NOT NULL,
location VARCHAR(255) NOT NULL
)`;

db.query(createApartmentsTableQuery, (err) => {
  if (err) {
    console.error("Error creating apartments table:", err);
    return;
  }
  console.log("Apartments table created");
});

// Inside your MySQL connection setup
const createJobsTableQuery = `
CREATE TABLE IF NOT EXISTS jobs (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) NOT NULL,
description TEXT,
technician INT NOT NULL,
apartment INT NOT NULL,
note TEXT,
imageUrls JSON,
status ENUM('Rescheduled', 'Assigned', 'Inprogress', 'Unscheduled', 'Completed', 'Cancelled'),
timeline VARCHAR(255),
duetime VARCHAR(255),
responsibilities JSON,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (technician) REFERENCES technicians(id),
FOREIGN KEY (apartment) REFERENCES apartments(id)
)`;

db.query(createJobsTableQuery, (err) => {
  if (err) {
    console.error("Error creating jobs table:", err);
    return;
  }
  console.log("Jobs table created");
});

// Inside your MySQL connection setup
const createAdminTableQuery = `
CREATE TABLE IF NOT EXISTS admin (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL
)`;

db.query(createAdminTableQuery, (err) => {
  if (err) {
    console.error("Error creating admin table:", err);
    return;
  }
  console.log("Admin table created");
});


// CREATE TABLE IF NOT EXISTS jobs (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   title VARCHAR(255) NOT NULL,
//   description TEXT,
//   technician INT NOT NULL,
//   apartment INT NOT NULL,
//   note TEXT,
//   imageUrls LONGTEXT,
//   status ENUM('Rescheduled', 'Assigned', 'Inprogress', 'Unscheduled', 'Completed', 'Cancelled'),
//   timeline VARCHAR(255),
//   duetime VARCHAR(255),
//   responsibilities LONGTEXT,
//   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updatedAt TIMESTAMP,
//   FOREIGN KEY (technician) REFERENCES technicians(id),
//   FOREIGN KEY (apartment) REFERENCES apartments(id)
// );
