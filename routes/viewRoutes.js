const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router.use(viewsController.alerts);

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get(
  '/tour/:tourSlug',
  authController.isLoggedIn,
  viewsController.getTour
);

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewsController.getSignUpForm);
router.get('/me', authController.checkLogin, viewsController.getAccount);
router.get('/my-tours', authController.checkLogin, viewsController.getMyTours);

module.exports = router;
