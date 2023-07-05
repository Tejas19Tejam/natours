const mongoose = require('mongoose');

const bookingScheme = new mongoose.Schema({
  // Parent referencing
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    require: [true, 'Booking must belongs to a Tour'],
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: [true, 'Booking must belongs to a User'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

// Only admin and tour Guide will query for bookings
bookingScheme.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingScheme);

module.exports = Booking;
