const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewsController');
const reviewRouter = require('./../routes/reviewRoutes');

// Create new Router (Sub application)
const router = express.Router();

// GET /tours/233424/reviews
// POST /tours/233424/reviews
// GET /tours/27773/reviews/fh6377rh37h

/** This router will be use when , tour route encounter below path  */
router.use('/:tourId/reviews', reviewRouter);

// Create Param middleware for id
// router.param('id', tourController.checkID);

// This also a middleware
router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tours-stats').get(tourController.getTourStat);

/** GET MONTHLY TOURS OF PARTICULAR YEAR  */
router
  .route('/monthly-plan/:year')
  .get(
    authController.checkLogin,
    authController.allowTo('admin', 'tour-guide', 'guide'),
    tourController.getMonthPlan
  );

/**
 * @route  GET /distances/:latlng/unit/:unit
 * @decs Get the distances of all tours from a specified point .
 * @access Public
 * @param {Number} latlng - Latitude and Longitude of current point
 * @param {String} unit - Unit of distance (i.e km , mails )
 *
 */

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

/**
 * @route GET /tour-within/:distance/center/:latlng/unit/:unit
 * @desc Get tours within specified geographic region (sphere )
 * @access Public
 * @param {Number} distance - Radius from current location
 * @param {String} latlng - Co-ordinates (Latitude and Longitude) from where you left
 * @param {String} unit - Distance unit (km , meter )
 * @returns All the tours within specified geographic region 
 *
 
 We can also specify this route using query string : 

 
         /tours-within?distance=200&center=23,45&unit=km

      
 */

// /tours-within/233/center/23,-67/unit/km
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

/** GET ALL TOURS , ADD NEW TOUR TO THE DATABASE  */
router
  .route('/')
  .get(tourController.getAllTours)
  // Middleware chaining
  .post([
    authController.checkLogin,
    authController.allowTo('admin', 'tour-guide'),
    tourController.addNewTour,
  ]);

/** GET , UPDATE , DELETE Tour using particular ID  */
router
  .route('/:id')
  .get(tourController.getThisTour)
  .patch(
    authController.checkLogin,
    authController.allowTo('admin', 'tour-guide'),
    tourController.uploadUserPhoto,
    tourController.resizeTourImage,
    tourController.updateTour
  )
  .delete(
    authController.checkLogin,
    authController.allowTo('admin', 'lead-guide'), // Only admin and lead-guide can delete the tour
    tourController.deleteTour
  );

module.exports = router;
