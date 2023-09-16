const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('dotenv');
env.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Technician admin panel!');
  });
  
app.use('/api/technician', require('./routes/technician')); 
app.use('/api/job', require('./routes/job'));
app.use('/api/apartment', require('./routes/apartment'));
app.use('/api/admin', require('./routes/admin'));

//404 error handling
app.use((req, res, next) => {
  res.status(404).json({ message: `Service Not Found - ${req.url}` });
  next();
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
