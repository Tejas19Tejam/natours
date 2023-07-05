const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Create User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have name '],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'User must have mail'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    trim: true,
    select: false,
  },
  confirmedPassword: {
    type: String,
    required: [true, 'Enter your confirmed password'],
    // This only works on CREATE , SAVE and not on UPDATE .
    validate: {
      validator: function (pswConfirmed) {
        return pswConfirmed === this.password;
      },
      message: 'Password must me same',
    },
  },

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExp: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// // Encrypt password before saving to database
// // This middleware will run if only password field is modified
userSchema.pre('save', async function (next) {
  // this ===> Current document
  // If password field is not modified , then exit the function and call the next middleware function
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // When the validation was successful, we actually no longer need this field so we really do not want to persist it to the database. And so that's why we simply set it here to undefined.
  this.set('confirmedPassword', undefined, { strict: false });

  next();
});

/** Update changedPasswordAt property/field  for the user if password is modified */
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/**
 * Query middleware , which will run before mongoose query that starts with find
 * this ------> Current Query Object
 */
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

/**
 * Creating Instance Method  The method that available on the every document of particular collection
 * @param {String } candidatePassword - User entered password
 * @param {String} userPassword  - Database hashed password
 * @returns {Boolean} True if userPassword is correct  match with database password
 */
userSchema.methods.checkPassword = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * @description Check if password is changed  or not .
 * @param {Number}  JWTTimestamp - Time at which the token is issued
 * @returns {Boolean} True if password is changed
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // Password is changed after token is issued .
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Generating random 32bit hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypting the random string  (HASHING )
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExp = Date.now() + 10 * 60 * 1000;
  // console.log(this.passwordResetExp);

  // This token we will send vie Email .
  // Its encrypted version is stored in the database and its valid for only 10 mins

  return resetToken;
};

// Create Model
const User = mongoose.model('User', userSchema);

module.exports = User;
