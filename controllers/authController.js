const passport = require('passport');
const mongoose = require('mongoose');
const crypto = require('crypto');
const promisify = require('es6-promisify');

const User = mongoose.model('User');

// authenticate with 'local' strategy
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are logged in'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  req.flash('error', 'You must be logged in!');
  res.redirect('/login');
}

exports.forgot = async (req, res) => {
  // check whether the user with provided email exists in the DB
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with this email exists');
    res.redirect('/login');
  }

  // set reset token and expiry in user's account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // send email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `You have been emailed a password reset link: ${resetURL}`);

  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: new Date() } // look for expires that greater than ($gt) now
  });
  
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  res.render('reset', { title: 'Reset your password' });
};

exports.confirmPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }

  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: new Date() } // look for expires that greater than ($gt) now
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  
  // promisify setPassword which is available by 'passport-local-mongoose' plugin
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password); // set new password

  // remove resetPasswordToken and resetPasswordExpires fields from user document
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();

  // login user with updated password
  await req.login(updatedUser);

  req.flash('success', 'Your password has benn reset!');
  res.redirect('/');
};
