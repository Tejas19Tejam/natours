// This will Authenticate the user before perform any activity (i.e CRUD operations )

const jwt = require('jsonwebtoken');
const User = require('./../models/userModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const { promisify } = require('util');
const Email = require('./../utils/email.js');
const crypto = require('crypto');

// SignToken
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRETE_KEY, {
    expiresIn: process.env.JWT_SESSION_EXPIRES_IN,
  });
};

/** This will create a token and send to the user as a response
 * @param {Object} user - User document
 * @param {Number} StatusCode - Status Code
 * @param {Object} res - Response object
 */
const createTokenAndSend = function (user, statusCode, res, req) {
  const token = signToken(user.id);

  // If we are in production , then cookies will be send vie HTTPS connections
  // Sending Cookie
  res.cookie('jwt', token, {
    // Cookies will expire in specified milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  });

  // Remove the password and active status from the output
  user.password = undefined;
  user.active = undefined;

  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Registering user and sending the token for instant login to application
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmedPassword: req.body.confirmedPassword,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcomeMail();

  // Generating Token
  /**
   * payload(Object) - The payload is the data that we can encode into the token .
   * secreteOrPrivateKey -- Use to authenticate user
   * Option(Object) -- More information about token (algorithm , expiresIn etc )
   *
   */
  createTokenAndSend(newUser, 201, res, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  // Reading email , and password
  const { email, password } = req.body;

  // 1) Check if email and password is exist
  if (!email || !password) {
    return next(new AppError('Please provide the email and password ', 400));
  }
  // 2) Check if email and password  correct
  // console.log(req.body.email);
  const user = await User.findOne({ email }, { password: 1 });

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password  ', 401));
  }

  // 3) If everything is ok , then send the JSON web token to user

  createTokenAndSend(user, 200, res, req);
});

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'dummycookies', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    data: {
      status: 'success',
    },
  });
};

// LoginChecker
exports.checkLogin = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking of if its there
  // console.log(req.headers);
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    next(
      new AppError('You are not logged in ! Please login to get access.', 401)
    );
  // 2) Verification of token

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRETE_KEY
  );
  // 3) Check if user still exist or check token is expire or not
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does not longer exist !',
        401
      )
    );
  }
  // 4) Check if the user changed password after the token is issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password , please login again',
        401
      )
    );
  }
  // GRANT ACCESS TO THE PROTECTED ROUTES
  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});

// isLoggedIn
/** Only for render pages , and no errors!  */

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify Token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRETE_KEY
      );
      // 2) Check if user still exist or check token is expire or not
      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
      }
      // 3) Check if the user changed password after the token is issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      /**
  
  
    In Pug templating, res.locals is an object that contains response local variables that are scoped to the request. These variables can be accessed in the view (Pug template) and can be used to pass data from the server to the view.

    The code res.locals.user = freshUser; sets the user property on the res.locals object to the value of freshUser. This means that the user variable is now available in the Pug template and can be used to display data related to the user.

    For example, if you have a Pug template that displays user information, you could use res.locals.user to pass the user data to the template:

    */
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Authorization

exports.allowTo = (...roles) => {
  // roles = ['admin','lead-guide'] role='user'
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You don't have permission to perform this action.`, 403)
      );
    }
    next();
  };
};

// Forgot Password
// This will receive the email address
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne(
    { email: req.body.email },
    { email: 1, name: 1 }
  );

  if (!user) next(new AppError('There is no user with email address', 404));

  // 2) Generate the random Token
  const randomToken = user.createPasswordResetToken();

  // Saving to tha database
  // {validateBeforeSave:false} : This will then deactivate all the validaters that we specified in our schema.
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email ID

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${randomToken}`;

  try {
    await new Email(user, resetURL).sendPasswordResetMail();

    res.status(200).json({
      status: 'success',
      message: `Password rest link has been send to your registered ${user.email} email id. `,
    });
  } catch (err) {
    console.log(err);
    // If something goes wrong , while sending email .
    user.passwordResetToken = undefined;
    user.passwordResetExp = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error while sending an emil! Try again later . ',
        500
      )
    );
  }
});

// Reset Password
// This will receive the new password  and Token
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExp: {
      $gt: Date.now(),
    },
  });

  // If error
  if (!user) {
    return next(new AppError('Invalid token or token has expired!', 400));
  }

  // 2) If there is a user and token is not expired , set new password
  user.password = req.body.password;
  user.confirmedPassword = req.body.confirmedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExp = undefined;
  await user.save();

  // 3) Update changedPasswordAt property/field  for the user
  // user.passwordChangedAt = Date.now();

  // 4) Log in user , send JWT
  createTokenAndSend(user, 200, res, req);
});

// Update Password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collections
  const user = await User.findById(req.user.id, { password: 1 });

  // 2) Check POSTed current password is correct
  if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Current password is wrong !', 401));
  }

  // 3) If so , Update the password
  user.password = req.body.password;
  user.confirmedPassword = req.body.confirmedPassword;
  await user.save();
  // User.findByIdAndUpdate will not work as intended

  // 4) Log the user in , Send JWT
  createTokenAndSend(user, 200, res, req);
});
