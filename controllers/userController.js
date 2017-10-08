const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  // sanitaze req.body.name with express validator package
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'Email is not valid!').notEmpty().isEmail();
  req.sanitizeBody('email').normalizeEmail({
    gmail_remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password can not be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // create new function of User.register with promisify (so it returns promise instead of callback) on User object
  const registerWithPromise = promisify(User.register, User);
  // register user with password
  // 'passport-local-mongoose' creates hash of password and saves this hashed version (not the real password)
  await registerWithPromise(user, req.body.password);
  next();
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit your account' });
};

exports.updateAccount = async (req, res) => {
  const updates = { name: req.body.name, email: req.body.email };
  const user = await User.findOneAndUpdate(    
    { _id: req.user._id }, // query
    { $set: updates }, // update user object with 'updates'
    { new: true, runValidators: true, context: 'query' } // options
  );
  
  req.flash('success', 'Account info was successfully updated');
  res.redirect('/account');
};
