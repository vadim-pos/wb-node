const mongoose = require('mongoose');
const slug = require('slugs');
mongoose.Promise = global.Promise;

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    // trim whitespaces from the value
    trim: true,
    // can be passed a boolean (true/false) or a string that will be used as an error
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now()
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);

  // find other stores that have the same slug
  const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithCurrentSlug = await this.constructor.find({ slug: slugRegex });
  // if stores with current slug are already exist - add numeric postfix to current slug
  if (storesWithCurrentSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  
  next();
});

module.exports = mongoose.model('Store', storeSchema);