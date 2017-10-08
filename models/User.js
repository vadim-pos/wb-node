const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Create virtual field 'gravatar' which is not stored in the DB
userSchema.virtual('gravatar').get(function() {
  const emailHash = md5(this.email);
  return `https://gravatar.com/avatar/${emailHash}?s=200`;
});

// add passport login plugin, use email filed from userSchema for authentication
// also add's .register static method to the userSchema
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// plugin enables pretty errors from mongo DB (for example unique error)
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);