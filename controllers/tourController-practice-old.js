const fs = require('fs');
// const Tour = require('../models/tourModel');

// Reading tours-data
// Converting json data into JS object

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkBody = (req, res, next) => {
  // if (Object.keys(req.body).length === 0) {
  if (!req.body.name || !req.body.price) {
    // 400 -> Bad Request
    return res.status(400).json({
      status: 'fail',
      data: {
        message: 'Name or Price is not present',
      },
    });
  }
  // If condition is OK then go to next middleware i.e tourController.getThisTour
  next();
};

exports.checkID = (req, res, next, val) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      data: {
        message: 'Invalid ID',
      },
    });
  }

  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getThisTour = (req, res) => {
  // console.log(req.params);
  const { id } = req.params;
  const tour = tours.find((tour) => tour.id === +id);

  // Check id is present or not
  if (id > tours.length) {
    if (!tour) {
      return res.status(404).json({
        status: 'fail',

        data: {
          message: 'Invalid ID',
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      data: {
        tour,
      },
    });
  }
};

exports.addNewTour = (req, res) => {
  // Creating ID for tour
  const newId = tours[tours.length - 1].id + 1;
  // Creating new Tour from response body
  const newTour = Object.assign({ id: newId }, req.body);
  // Adding new tour to the tours array
  tours.push(newTour);
  // Writing new tour to the file
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        message: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
  // console.log(newTour);/????
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      message: '<Updated ID is here>',
    },
  });
};

exports.deleteTour = (req, res) => {
  // 204 - Content not Present
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
