const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('./../controllers/authController');

// New router sub-application
const router = express.Router({ mergeParams: true });

router.use(authController.checkLogin);

/** GET ALL REVIEWS  */

// POST /tours/233424/reviews =====> (Create new review for tourId (233424) )

// GET /tours/233424/reviews      ======>  ( Get all the reviews of tourId (233424)  )

// GET /tours/27773/reviews/fh6377rh37h =====>  (Get review of id fh6377rh37h of tourId (27773))

/** GET ALL REVIEWS AND ONY USER'S CAN CREATE REVIEWS  */
router
  .route('/')
  .get(reviewsController.getAllReviews)
  .post(
    authController.allowTo('user'),
    reviewsController.setTourUserId,
    reviewsController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.allowTo('user', 'admin'),
    reviewsController.deleteReview
  )
  .patch(
    authController.allowTo('user', 'admin'),
    reviewsController.updateReviews
  )
  .get(reviewsController.getReview);

module.exports = router;
