const catchAsync = require('../utils/catchAsync.js');
const User = require('./../models/userModel.js');
const AppError = require('./../utils/appError.js');
const factory = require('./handlerFactory.js');
const multer = require('multer');
const sharp = require('sharp');

/**
 * @description The disk storage engine gives you full control on storing files to disk.
 */
// const multerStorage = multer.diskStorage({
//   /**
//    * @description destination is used to determine within which folder the uploaded files should be stored.
//    * @param {Object} req - Current Request
//    * @param {String} file  - Current file uploaded
//    * @param {Function} cb - Call back function
//    */
//   destination: (req, file, cb) => {
//     /**
//      * @param - Error if any , else null
//      * @param - File destination
//      */
//     cb(null, 'public/img/users');
//   },
//   /**
//    * @description filename is used to determine what the file should be named inside the folder. If no filename is given, each file will be given a random name that doesn't include any file extension.
//    * @param {Object} req - Current request
//    * @param {String} file - Current file
//    * @param {Function} cb -  Callback function
//    */
//   filename: (req, file, cb) => {
//     // user-3552fshhdggs-24155372.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

/**
 * @description The disk storage engine gives you full control on storing files to memory .
 */

const multerStorage = multer.memoryStorage();

/**
 * @description Set this to a function to control which files should be uploaded and which should be skipped.
 */
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

// Filter Object
const filterObject = (bodyObj, ...fields) => {
  const newObj = {};
  Object.keys(bodyObj).forEach((elm) => {
    if (fields.includes(elm)) newObj[elm] = bodyObj[elm];
  });
  return newObj;
};

// UPLOAD PHOTO MIDDLEWARE
exports.uploadUserPhoto = upload.single('photo');

// RESIZE USER PHOTO
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // If photo is not uploaded then return next middleware
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  /**  In Node.js, a buffer is a temporary holding area for data in memory. It is a built-in data type that is used to represent a sequence of bytes. Buffers are typically used to work with binary data, such as images, audio files, and network packets. */
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//  UPDATE USER PERSONAL INFORMATION (email , name , photo etc ) NOT FOR PASSWORD
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user trying to POST password data
  if (req.body.password || req.body.confirmedPassword) {
    return next(
      new AppError(
        'This route is not for password update , please use /updateMyPassword route!',
        400
      )
    );
  }

  // 2) Update user data (i.e name , email )
  const filteredBody = filterObject(req.body, 'name', 'email');

  // 3) Check if user is trying to upload a photo
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/** By using this endpoint the user can retrieve his own data .  */
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  // console.log(req.user.id);
  // 1) Find user in the database and update it
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // Sending Response
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAllOne(User);

exports.getThisUser = factory.getOne(User);

/**  Do not update password using this method  */
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: {
      data: '<This route is not yet define .Please use /signup instead !>',
    },
  });
};
