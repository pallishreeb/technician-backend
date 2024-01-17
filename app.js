const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const env = require('dotenv');
env.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(function(req, res, next) {
  //let origin = ["*","http://localhost:3000"];
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Referer, Accept,x-access-token,Authorization");
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

app.use(morgan('combined'));
app.use('/uploads', express.static('uploads'));

app.use(express.static('build')); // Assuming your React build is in a directory named 'build'

// Routes
app.get('/api', (req, res) => {
  res.send('Welcome to Technician admin panel!');
});
  
app.use('/api/technician', require('./routes/technician')); 
app.use('/api/job', require('./routes/job'));
app.use('/api/apartment', require('./routes/apartment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


//404 error handling
app.use((req, res, next) => {
  res.status(404).json({ message: `Service Not Found - ${req.url}` });
  next();
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
