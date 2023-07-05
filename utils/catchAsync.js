module.exports = (fn) => {
  return (req, res, next) => {
    // This function will catch the error .
    fn(req, res, next).catch((err) => next(err));
  };
};
