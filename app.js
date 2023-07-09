// Implementing CRUD operation routes

// Express export function
const express = require('express');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssSanitize = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError.js');
const userRouter = require('./routes/userRoutes.js');
const toursRouter = require('./routes/tourRoutes.js');
const globalErrorHandler = require('./controllers/errorController.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRoutes = require('./routes/viewRoutes');
const app = express();

// Allow traffic from Reverse Proxy Server

app.enable('trust-proxy');

/** This code sets the view engine to Pug, indicating that Pug templates will be used to generate HTML output for this app.
 *
 * Pug Templates are called a view’s in express.
 */
app.set('view engine', 'pug');

/** Setting Location of Template views  */
// /home/tejas/Learnings/Learning/Study/NodeJS/Coding/4-natours/starter/views
// console.log(path.join(__dirname, 'views'));
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE

// set HTTP security headers
// app.use(cors());

app.use(cors());
// Access-Control-Allow-Origin  *

// Suppose we need to allow only subdomain of application
// Backend =   api.natours.com  /   Frontend =  natours.com

// app.use(
//   // This will allow only mentioned origin , to access resources from the server
//   cors({
//     origin: 'https://www.natours.com ',
//   })
// );

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Built in middleware

// Body parser , reading data from body into req.body
// Only 10 KiloBytes of data can be accept  to the body
app.use(express.json({ limit: '10kb' }));

// Cookie parser
// Reading the cookie from  incoming request
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssSanitize());

// Prevent HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'price',
    ],
  })
);

// Middleware use for compress data
app.use(compression());

// For accessing static files
/** 
 
 In a Node.js/Express application, app.use() is a method used to add middleware functions to the application's request handling pipeline. Middleware functions are functions that have access to the request and response objects, and can execute code and/or modify the request/response objects as they pass through the pipeline.

In the code you provided, express.static() is a built-in middleware function that serves static files, such as HTML, CSS, and JavaScript files, from a specified directory on the server. The path.join() method is used to create a file path by concatenating the __dirname variable, which is the directory of the current module, with the subdirectory public. This creates an absolute path to the public directory, which contains the static files that will be served by the middleware.

So essentially, app.use(express.static(path.join(__dirname, 'public'))) adds the express.static() middleware function to the application's pipeline, with the public directory as the root directory for serving static files. This means that any requests for static files (e.g. http://localhost:3000/styles.css) will be automatically handled by the middleware, without requiring any additional routing or controller code
 
 */
app.use(express.static(path.join(__dirname, 'public')));

// Third-party middleware
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Creating our own middleware function
// Note : The order of code (middleware) matters a lot in express
// app.use((req, res, next) => {
//   console.log('I am middleware ');
//   next();
// });

// Create limiter middleware
// Limit request for same API
// To use it in an API - only server where the rate - limiter should be applied to all requests
const limiter = rateLimiter({
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  windowMs: 60 * 60 * 1000, // 15 minutes
  standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
  message: 'To many requests from this IP , please try again in an hour!',
});

// parsing  data submitted in a URL-encoded format.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply the rate limiting middleware to all requests starts with /api route
app.use('/api', limiter);

// Test middleware
app.use((req, res, next) => {
  // console.log(req.cookies);
  req.requestTime = new Date().toISOString();
  console.log(new Date().toISOString());

  next();
});

////////////////////////////////// PROJECT START /////////////////////////////////////////

// Handling GET request
// GET = Gets called when client request data from the specified URL to the server

// app.get('/api/v1/tours', getAllTours);

// Handling POST request

// app.post('/api/v1/tours', addNewTour);

// Defining route which will access a variable of URL (req.params)
/**
 * req.params --->  Object of URL  variables (e.g 127.0.0.1:8000/api/v1/tours/7/45/32 : {id:5 ,y:67,c:4})
 *
 */

// app.get('/api/v1/tours/:id', getThisTour);

// Handling PATCH request
// app.patch('/api/v1/tours/:id', updateTour);

// Delete Tour
// app.delete('/api/v1/tours/:id', deleteTour);
app.use('/', viewRoutes);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handling Unhandled routes

// This middleware will run for all the HTTP request (ie GET , POST  , PATCH etc )
// '*' =====>  For all routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server !`,
  // });
  // next();

  // Generating error

  // const err = new Error(`Can't find ${req.originalUrl} on this server !`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

// Listening for the request
/**
 *  callback - Gets called when server start listening to the given port
 */

module.exports = app;
