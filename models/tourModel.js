const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

//SCHEMA
const tourScheme = new mongoose.Schema(
  {
    name: {
      unique: true,
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxlength: [40, 'a tour name must have less or equal than 40 characters'],
      minlength: [10, 'a tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'tour name must contain only letters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // round numbers to 1dp
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc not new doc
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //mongodb uses geojson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true }, //used with virtual properties
    toObject: { virtuals: true },
  },
);

tourScheme.index({ startLocation: '2dsphere' });
tourScheme.index({ price: 1, ratingsAverage: -1 }); // 1 => ascend; -1 => desc
tourScheme.index({ slug: 1 });
// tourScheme.index({ startLocation: '2dsphere' }); //telling mongodb startLocation shld be index to 2d(earthlike sphere)

// VIRTUAL PROPERTIES => properties we dont want to get saved in the database
tourScheme.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate for parenting referencing [ref child docs on parent docs without persisting the data to db]
tourScheme.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // name of referred field in child
  localField: '_id',
});

//DOCUMENT MIDDLEWATE: runs before  .save() and .create() only
tourScheme.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this point to current document
  next();
});

//embedding guides in tours
// tourScheme.pre('save', async function (next) {
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// a middleware can run before or after a document
//DOCUMENT MIDDLEWATE: runs after  .save() and .create() only
// tourScheme.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE => since find returns a query not document [/^find/ reqex for all strings that starts with find]
tourScheme.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // this point to current query

  this.start = Date.now();
  next();
});

//middleware to populate all documents by 'FIND' QUERY
tourScheme.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // to exclude some properties
  });

  next();
});

tourScheme.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//AGGREGATION MIDDLEWATE
// tourScheme.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this);
//   next();
// });

//MODEL
const Tour = mongoose.model('Tour', tourScheme);

module.exports = Tour;
