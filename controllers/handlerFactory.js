const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
/**
 * @description  Factory function to delete document of given Model
 * @param {Object}  Model - Collection's Model
 * @returns {Function}  Handler Function
 */

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError('No document found with that ID! ', 404));
    }
    // 204 - Content not Present
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

/** Factory Function to Update document of given Model */
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID! ', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: doc,
      },
    });
  });

/** Factory Function to Create new  document of given Model */
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Old way of creating Documents
    // const newTour = new Tour({})console.log('Creating');
    // newTour.save()

    // Modern way of creating Documents
    // This will  return a promise with new document as data argument
    const newTour = await Model.create(req.body);
    res.status(201).json({
      message: 'success',
      data: {
        tour: newTour,
      },
    });
  });

/** Factory Function to Get document of given Model
 * @param {Object} Model - Model - Collection's Model
 * @param {Object} popOption - Populate object
 */
exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id;

    /** If  populate is not define */
    let query = Model.findById(id);

    /** If populate option is define  */
    if (popOption) query = Model.findById(id).populate(popOption);

    const doc = await query;

    // If document not found (404) Error handling
    if (!doc) {
      return next(new AppError(`document not found for ${id} id `, 404));
    }

    res.status(200).json({
      status: 'success',
      durationWeeks: doc?.durationWeeks,
      data: {
        doc: doc,
      },
    });
  });

exports.getAllOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET  reviews on tours
    // If tourId is specified into the route (i.e GET /tours/233424/reviews) then then , we need to search reviews for that tourId in database
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTING A QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginatePage();

    const doc = await features.query;
    // const doc = await features.query.explain();

    return res.status(200).json({
      status: 'success',
      count: doc.length,
      data: {
        doc,
      },
    });
  });
