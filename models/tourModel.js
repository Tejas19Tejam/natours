const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require('./userModel');
// Creating Schema for Tours
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // Validators
      required: [true, "A tour must have a name "],
      unique: true,
      trim: true,
      maxLength: [40, "The name must be less or equal to 40 characters"],
      minLength: [10, "The name must be more or equal to 40 characters"],
      // Using validator from external library / module
      // validate: [validator.isAlpha, 'Tour name should contain only character'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration "],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "People count required"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have difficulty"],
      enum: ["easy", "medium", "difficult"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, "Rating must be less than 5 "],
      min: [1, "Rating must be greater or less than 1 "],
      /**
       * @description In Mongoose, a "setter" function is a function that can be defined on a schema property to modify the value of that property before it is saved to the database. A setter function is executed whenever a value is assigned to the property, either directly or through Mongoose's built-in setters.
       * @param {Number} value - Ratings Average
       * @returns Round Value
       */
      set: (value) => {
        return Math.round(value * 10) / 10; // 4.55555 = 45.5555 = 46 = 4.6
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price "],
    },
    // Create custom validator
    // To check priceDiscount is less then actual price
    // Only return True or False
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // 'this' ----> Current document object
          // val= current field
          return val < this.price;
        },
        message: `Discount price ({VALUE}) must be less than regular price`,
      },
    },
    secreteTour: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    // This will store the array of strings
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
      // To hide this filed from user
      // Basically this field is not include in the fields while document is send as a response to the client
      select: false,
    },
    startLocation: {
      // GeoJSON object
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // Array of longitude , latitude
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // To include virtuals in res.json(), you need to set the toJSON schema option to { virtuals: true }.
    toJSON: { virtuals: true, slug: true },
    toObject: { virtuals: true },
  }
);

/**  Creating SINGLE indexes on price field
 * 1 - Sorting the price index in the ascending order
 * 2 - Sorting the price index in descending order
 
 
 
 
tourSchema.index({price: 1 });
 */

tourSchema.index({ slug: 1 });

/** Creating compound indexing on ratingsAverage and price field  */
tourSchema.index({ ratingsAverage: 1, price: 1 });

/** Creating single geographical indexing on startLocation to execute a query more deficient way   */
tourSchema.index({ startLocation: "2dsphere" });

// Creating Virtual Property
// virtual property is created each time , when we try to fetch / get data from the database
tourSchema.virtual("durationWeeks").get(function () {
  // console.log('Running virtual...');
  // The "this" keyword here isTell me more about static method. pointing to the current document
  return this.duration / 7;
});

/** CREATE VIRTUAL POPULATE
 * ref = {Model} - It contains the name of the model from which we want to populate the document.
 * foreignField : {Document Field }  - This is the name of the field in the other model (Review). So in the Review model in this case, where the reference to the current model is stored.
 * localField : {Document Field }  - It is any field of the current collection.
 * */

tourSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id", // Find reviews where `localField`
  foreignField: "tour", // is equal to `foreignField`
});

// DOCUMENT MIDDLEWARE

// run before .save() and .create() method , but not on .insertMany()
// This function will be called before an actual document is saved to the database.
// "this" ====> Currently processed document
tourSchema.pre("save", function (next) {
  // Creating slug using tour name
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre("save", function (next) {
  console.log("Will save the document");
  next();
});

/** To embedded guides id into the tours data base */

// tourSchema.pre('save', async function (next) {
//   // Callback function will return a promise
//   // So guidesPromise is an array of promises
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   // Resolving the promises all at a same time
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// Creating a post()-save-hook / middleware
// Execute after all pre() middleware have completed
tourSchema.post("save", function (doc, next) {
  // console.log(doc);
  next();
});

// QUERY MIDDLEWARE

// Pre-find hook
// Execute before any query
// "this" ==> Current query object
// This will only run for find() method and not for findOne , findDelete etc ... For that we need to use RE .
// tourSchema.pre('find', function (next) {
// /^find/ (RE)= Run this middleware for all queries start with find
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  console.log("Executing Pre find query middleware");
  this.start = Date.now();
  this.find({ secreteTour: { $ne: true } });
  next();
});

/** This middleware will populate the given field   */
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordResetToken -passwordResetExp -passwordChangedAt",
  });
  next();
});

// Post-find hook
// Execute after the query completely executes(i.e all the pre middleware executed)
// " this " ----> Returned documents
tourSchema.post(/^find/, function (doc, next) {
  console.log("Executing Post find query middleware");
  console.log(`Query took ${Date.now() - this.start} milliseconds ! `);
  next();
});

// AGGREGATION MIDDLEWARE

// " this " -->  Aggregation object
// tourSchema.pre('aggregate', function (next) {
//   console.log('Executing Pre aggregate middleware');
//   // This will return a array of aggregation stages
//   // console.log(this.pipeline());
//   this.pipeline().unshift({
//     $match: {
//       secreteTour: { $ne: true },
//     },
//   });
//   console.log(this.pipeline());
//   next();
// });

// Creating Model
// Alway use Upper case to create model
// Compile a model from the schema
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

///////////////////// Practice Code //////////////////////////////////////////

// // Creating the Document
// // testTour is a instance of Tour Model
// // So testTour has some methods to interact with database
// const testTour = new Tour({
//   name: 'Sheeda,Parpoli',
//   price: 500,
// });

// // This will return a promise
// // In which can access a document that we just created using new Tour
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
