const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
// REVIEW SCHEMA

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A tour must have review!'],
    },

    rating: {
      type: Number,
      max: [5, 'Ratings must be less than or equal to 5 !'],
      min: [1, 'Ratings must be greater or equal to 1!'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // required: [true, 'Review must belongs to user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      // required: [true, 'Review must belongs to tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Creating compound indexes on user and tour field to avoid duplicate review  */

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/** Creating static method on reviewSchema object
 * @param {String} tourId - TourId is a Tour to which the current review belongs to .
 */

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this - Pints to the current model

  // Well the first step should be to select all the reviews that actually belong to the current tour that was passed in as the argument.

  const result = await this.aggregate([
    // Stage 1 : Matching
    {
      $match: { tour: tourId },
    },
    //Stage 2 : Grouping

    {
      $group: {
        // Group by tour
        _id: '$tour',
        // nRatings = Number of Reviews of tourdId + 1
        nRating: { $sum: 1 },
        // avgRating = Average of Rating Field
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(result);
  // Updating the current tour
  if (result.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: result[0].avgRating,
      ratingsQuantity: result[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

/** This middleware will call each when we create , save or update a review  */
reviewSchema.post('save', function () {
  // this - points to the current review document
  this.constructor.calcAverageRatings(this.tour);
});

/** QUERY MIDDLEWARE FOR POPULATING FIELDS  */

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

/** This middleware will run before document is updated or save  */
/** 
 
      1. findByIdAndUpdate  -  Update Review 
      2. findByIdAndDelete  -  Delete Review 
 
 Note that findByIdAndUpdate will not run any Mongoose middleware defined for save(). If you want Mongoose middleware to be run, you should use findOneAndUpdate instead. 


  1. findOneAndUpdate, on the other hand, is used to update a document based on a query. 
  
  Note : 

  Issues a mongodb findOneAndUpdate command by a document's _id field. findByIdAndUpdate(id, ...) is equivalent to findOneAndUpdate({ _id: id }, ...).

*/

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // This wil give the document that currently being processed
  /**
   * Here this.r = We are creating property (r) on query object .
   * This technique is use to pass  data from pre middleware to post middleware
   */
  this.r = await this.findOne();

  next();
});

/**
 * @description This middleware is use to update the average ratings
 *
 */
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); Does NOT work here because the query has already executed .
  // Using " this.r " we can retrieve the review document .
  await this.r?.constructor.calcAverageRatings(this.r.tour);
});

// REVIEW MODEL
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
