const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tours data from collection
  const tours = await Tour.find();

  // 2) Build Template

  // 3) Render that template using tour data from step 1

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Find Tour details for requested Tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate({
    path: "reviews",
    fields: "review  rating user ",
  });

  // If tour not found Catching Error
  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }

  // 2) Build Template

  res.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your Account",
  });
};

exports.getSignUpForm = (req, res) => {
  res.status(200).render("signup", {
    title: "Create new Account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

// Update User data
exports.updateUserData = catchAsync(async (req, res) => {
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name, email: req.body.email },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

// Get all tours that current log in user booked
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1 ) Find all Booking
  const bookings = await Booking.find({ user: req.user.id });
  if (!bookings) next(new AppError(`No tours booked yet `));

  // 2 ) Find tours with the return ID's
  const tours = bookings.map((book) => book.tour);
  console.log(tours);
  return res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });

  // return res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tours,
  //   },
  // });
});

// Show alert message when something major change happen ( Purchase new tour )
exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  switch (alert) {
    case "booking":
      res.locals.alert =
        "Your booking was successful! please check your mail for a confirmation . If your booking does't show up here immediately , please come back later.";
      break;
  }
  next();
};
