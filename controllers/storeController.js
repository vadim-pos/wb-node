const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const uuid = require('uuid');
// resize images
const jimp = require('jimp');

// allows upload photos
const multer = require('multer');
const multerOptions = {
  // save file buffer to the memory
  storage: multer.memoryStorage(),
  // check file mimetype and ensure that only images can be uploaded
  fileFilter: (req, file, next) => {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) return next(null, true);

    next({ message: `File type ${file.mimetype} isn't allowed!` }, false);
  }
};

exports.homePage = (req, res) => {
  res.render('index');
}

// Allow upload with multer only one field called 'photo'
exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // multer puts uploaded file into req.file
  if (!req.file) return next();
  
  const fileExtension = req.file.mimetype.split('/')[1]; // get file extension
  req.body.photo = `${uuid.v4()}.${fileExtension}`; // create new file name with unique id
  
  const photo = await jimp.read(req.file.buffer) // read photo buffer
  await photo.resize(800, jimp.AUTO); // resize width to '800px' with 'auto' height
  await photo.write(`./public/uploads/${req.body.photo}`); // save resized photo into new file
  next();
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // add autor for the store
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/stores/${store.slug}`);
}

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
}

const confirmOwner = (store, user) => {
  // Object id has an 'equals' method for comparing two _id properties
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store to edit it');
  }
}

exports.editStore = async (req, res) => {
  // Find given store by ID
  const store = await Store.findOne({ _id: req.params.id });
  // Confirm that user is a store owner
  confirmOwner(store, req.user);
  // Renderout edit store 
  res.render('editStore', { title: 'Edit Store', store });
}

exports.updateStore = async (req, res) => {
  // Add location 'Point' type to properly display this data in Mongo Compass app
  req.body.location.type = 'Point';
  // Find and update store by ID
  const store = await Store.findOneAndUpdate(
    // query object
    { _id: req.params.id },
    // updates object
    req.body,
    // operation options
    { new: true, runValidators: true } // return new store instead of the old one, run schema validators
  ).exec(); // execute operation on DB

  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View store</a>`);


  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
  // const store = await Store.findOne({ slug: req.params.slug });
  const store = await Store.findOne({ slug: req.params.slug }).populate('author');
  if (!store) return next();

  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };

  // fetch tags with appropriate stores count
  const tagsPromise = Store.getTagsList();
  // fetch stores with selected tag
  const storePromise = Store.find({ tags: tagQuery });
  // get result of two promises
  const [tags, stores] = await Promise.all([tagsPromise, storePromise]);

  res.render('tag', { tags, tag, stores });
};


exports.searchStores = async (req, res) => {
  // search for stores by 'name' and 'description' fields wich are has been indexed as 'text' in Store model
  const stores = await Store.find({
    $text: {
      $search: req.query.q
    }
  }, {
    // add score field to returning data objects which represents amount of number of coincidences with query
    score: { $meta: 'textScore' }
  })
  .sort({
    // sort by this new score field
    score: { $meta: 'textScore' }
  })
  // return first 5 stores
  .limit(5);
  res.json(stores);
};