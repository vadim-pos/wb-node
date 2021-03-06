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
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'Ypu must supply an author'
  }
});

// Define indexes
storeSchema.index({
  name: 'text',
  description: 'text'
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

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Store', storeSchema);