const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// CREATING ROUTES FOR AUTHENTICATION
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//  FORGOT PASSWORD ROUTE
router.post('/forgotpassword', authController.forgotPassword);

// REST PASSWORD ROUTE
router.patch('/resetpassword/:token', authController.resetPassword);

/** After this middleware we need to Authenticate to access any routes */
router.use(authController.checkLogin);

// UPDATE PASSWORD
router.patch('/updateMyPassword', authController.updatePassword);

// /me route
router.get('/me', userController.getMe, userController.getThisUser);

// UPDATE NAME AND EMAIL

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

// DELETE USER
router.delete('/deleteMe', userController.deleteMe);

/** After this middleware , only administrator can access this routes */
router.use(authController.allowTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createNewUser);

router
  .route('/:id')
  .get(userController.getThisUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
