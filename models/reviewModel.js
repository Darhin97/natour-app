const mongoose = require('mongoose');
const Tour = require('./tourModel');

//schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      requred: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true }, //used with virtual properties
    toObject: { virtuals: true },
  },
);

// ensures 1 user 1 review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//middleware to populate all documents by 'FIND' QUERY
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'user',
  //     select: 'name photo', // return only the name and phot
  //   }).populate({
  //     path: 'tour',
  //     select: 'name',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo', // return only the name and phot
  });
  next();
});

//statics methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //THIS points to the model in a static method
  const stats = await this.aggregate([
    //select all reviews of the tour passed in
    {
      $match: { tour: tourId },
    },
    //calc the statistics itself
    {
      $group: {
        // _id is what the have in common
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].nRating,
      ratingsQuantity: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }
};

//post middleware doesnt have access to next
reviewSchema.post('save', function () {
  //this points to the currently saved review model [using this.constructor]
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //get the document to edit this.r is used to pass the doc from pre middleware to the post middleware
  this.r = await this.findOne();
  // console.log(this.r);
});

reviewSchema.post(/^findOneAnd/, async function () {
  //get the document to edit from pre middleware
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

//Model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
