const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory.js');
const multer = require('multer');
const sharp = require('sharp');

// CONFIGURING MULTER
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Only image files are allowed to be uploaded.', 415),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// UPLOAD PHOTO MIDDLEWARE
exports.uploadUserPhoto = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image')
// upload.array('images',2)

exports.resizeTourImage = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  console.log(req.files);

  // 1 ) Image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2 ) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);
      req.body.images.push(fileName);
    })
  );
  next();
});

exports.getAllTours = factory.getAllOne(Tour);

exports.getThisTour = factory.getOne(Tour, { path: 'reviews' });

exports.addNewTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// alias for Top-5-cheapest tours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name , price ,ratingsAverage,summary,difficulty';

  next();
};

// Aggregation Pipeline
// Syntax: db.collection.aggregate( [ { <stage> }Create, ... ] )
exports.getTourStat = catchAsync(async (req, res, next) => {
  // This will return an aggregate query
  // To see exact result we need to use await
  const stats = await Tour.aggregate([
    // Stage 1 : Matching
    // Sorting documents whose ratingAverage >= 4.5
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    // Stage 2 : Grouping
    {
      $group: {
        // _id = What we want to group by (i.e Group by difficulty , price , rating etc )
        // The group stage separates documents into groups according to a "group key". The output is one document for each unique group key.
        _id: { $toUpper: '$difficulty' }, // Group Key
        // Syntax : newField : {$<operator>:'$<Expression (fieldName)>'}
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // Stage 3 : Sorting
    // Syntax : { $sort: { <field1>: <sort order>, <field2>: <sort order> ... } }
    // In this stage we need to use fields naconsole.log('Creating');mes that we specifies in the GROUPING stage
    {
      $sort: {
        // 1 = Ascending Order , -1 = Descending Order
        avgPrice: -1,
      },
    },
    // Repeating Staged : We can repeat stages
    // {
    //   // ne= Not Equal to
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      // Stage 1 : unwind
      $unwind: '$startDates',
    },
    // Stage 2 : Match
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // Stage 3: Group
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        // Pushing name of documents into an array(tours)
        tours: { $push: '$name' },
      },
    },
    // Stage 4: Add Fields
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      // Stage 5
      $project: {
        _id: 0,
      },
    },
    // Stage 5 : Remove Fields
    // {
    //   $unset: '_id',
    // },

    // Stage 6: Sorting by numOfTours
    {
      $sort: {
        numTours: -1,
      },
    },
    {
      $limit: 11,
    },
  ]);

  res.status(200).json({
    status: 'success',
    plan,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  /** Calculating radian
   *
   * Earth Radius from Equator in mails = 3958.8 mi
   * Earth Radius from Equator in kilometer  = 6371 km
   * Radian = a radian is a unit of measurement for angles.
   * Formula : 
          
          Radian =  distance / radiusOfEarth 
   */
  const radian = unit === 'mi' ? distance / 3958.8 : distance / 6371;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lng !',
        400
      )
    );
  }

  /**
   * $geoWithin - $geoWithin is a MongoDB operator that is used to specify a query that finds documents within a specified geographic shape.
   *
   */
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radian] } },
  });

  res.status(200).json({
    results: tours.length,
    status: 'success',
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lng !',
        400
      )
    );
  }

  const result = await Tour.aggregate([
    // geoNear - This stage is alway need to be a first step in geo-special aggregation
    // For more info see doc file
    // Stage 01 : geoNear
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        spherical: true,
        distanceMultiplier: multiplier,
      },
    },
    /**
     * A project stage in the aggregation pipeline is used to reshape the document by specifying which fields to include or exclude.
     * This is useful when you want to limit the number of fields in the output document or rename fields.
     */

    // Stage 02 : Project
    {
      $project: {
        name: 1,
        distance: 1,
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: result,
    },
  });
});
