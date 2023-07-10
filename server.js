'use strict';
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handling : uncaughtException
process.on('uncaughtException', (err) => {
  console.log(' Uncaught Exception 💥 shouting down .....');
  console.log(err.name, err.message);
  // Shouting down application
  // Exit code = 1 (Process exit with failure)
  process.exit(1);
});

// Configuring ENVIRONMENT VARIABLES
dotenv.config({ path: './config.env' });
const app = require('./app');
// Listening port
const port = process.env.DATABASE_PORT;

// Create database connection
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PWD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to database');
  });
const server = app.listen(port, () => {
  console.log('Listening to port 8000 ....');
});
// console.log(app.get('env')); // Display current environment of application (set by express)
// console.log(process.env.NODE_ENV); // Accessing the environment variable

// Handling : Unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log('Unhandled rejection 💥 shouting down .....');
  console.log(err.name, err.message);
  // Shouting down application
  // Exit code = 1 (Process exit with failure)
  server.close(() => {
    process.exit(1);
  });
});

// Only for Heroku
// process.on('SIGTERM', () => {
//   console.log('SIGTERM receives . Shouting down gracefully !');
//   server.close(() => {
//     console.log('Process Terminated !');
//   });
// });
