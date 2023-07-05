const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

// Importing stripe library , to our API
// This will return a function , and then we will pass stripe secrete key as an parameter into that function
// Then after this function will return a stripe object

const stripe = require('stripe')(process.env.STRIPE_SCRT_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 ) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2 ) Create checkout session

  /**
   * Creating payment form (checkout session)
   * After creating a Checkout Session, redirect your customer to the URL returned in the response.
   */
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // Redirect URL once the payment completed
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    // Redirect URL if the payment cancelled
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    // This field is allow us to pass in some data about the session that we are currently creating
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'INR',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3 ) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // Only temporary implementation , because it's UNSECURE :  everyone can book a tour without pay
  const { user, tour, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // This will redirect the application to the mentioned URL
  res.redirect(req.originalUrl.split('?')[0]);
});

/** CRUD Operations  */
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.getAllBooking = factory.getAllOne(Booking);
exports.getBooking = factory.getOne(Booking);
