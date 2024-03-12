//function the returns another fxn
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
