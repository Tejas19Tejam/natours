const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './../../config.env' });
const Tour = require(`./../../models/tourModel`);
const Review = require(`./../../models/reviewModel`);
const User = require(`./../../models/userModel`);

// Listening port
const port = process.env.DATABASE_PORT;

// Create database connection
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PWD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to database`);
  })
  .catch((err) => {
    console.log(err);
  });

const tours = JSON.parse(
  fs.readFileSync(`./tours.json`, 'utf-8', (err, data) => {
    if (err) return err;
    return data;
  })
);
const reviews = JSON.parse(
  fs.readFileSync(`./reviews.json`, 'utf-8', (err, data) => {
    if (err) console.log(err);
    return data;
  })
);
const users = JSON.parse(
  fs.readFileSync(`./users.json`, 'utf-8', (err, data) => {
    if (err) console.log(err);
    return data;
  })
);

// console.log(tours);
// UPLOAD DATA TO DATABASE
const uploadData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });

    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA FROM THE DATABASE
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();

    console.log('Data successfully removed');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// The process.argv property returns an array containing the command-line arguments passed when the Node.js process was launched. The first element will be process.execPath. See process.argv0 if access to the original value of argv[0] is needed. The second element will be the path to the JavaScript file being executed. The remaining elements will be any additional command-line arguments.
// console.log(process.argv);

if (process.argv[2] === '--upload') {
  uploadData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to database`);
  })
  .catch((err) => {
    console.log(err);
  });
