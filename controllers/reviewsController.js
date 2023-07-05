const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory.js');

/** This handler will set the user ID and tour ID to the request body  */
exports.setTourUserId = (req, res, next) => {
  // Allow nested routes
  // User can still specify manually the tour and user ID
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

/** CREATE NEW  REVIEWS  */
exports.createReview = factory.createOne(Review);

/** GET PARTICULAR OR ALL REVIEWS  */
exports.getAllReviews = factory.getAllOne(Review);

/** DELETE REVIEW   */
exports.deleteReview = factory.deleteOne(Review);

/** UPDATE REVIEWS  */
exports.updateReviews = factory.updateOne(Review);

/** GET REVIEWS  */
exports.getReview = factory.getOne(Review);
