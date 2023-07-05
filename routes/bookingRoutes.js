const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('./../controllers/authController');

// New router sub-application
const router = express.Router();

router.use(authController.checkLogin);

router.get(
  '/checkout-session/:tourId',
  authController.checkLogin,
  bookingController.getCheckoutSession
);

router.use(authController.allowTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
