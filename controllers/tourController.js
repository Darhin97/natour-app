// const { Query } = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const catchAsync = require('../utils/catchAsync');

//stores image in memory as buffer, for easy access/ usage in sharp
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image') // returns req.file
// upload.array('images') // returns req.files

//resize images middleware
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);

  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // 1 cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2 Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );

  next();
});

// middleware
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//query => coming from mongoose eg Tour.find()
//queryStr => coming from route eg

/////////////// 2) ROUTE HANDLER FUNCTION
exports.getAllTours = async (req, res) => {
  // console.log(req.query);

  try {
    // //BUILD QUERY
    // //1A FILTERING
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields']; // exclude values from query
    // excludedFields.forEach((el) => delete queryObj[el]);

    // //1A ADV FILTERING( gte= greater or equal, gt, lt, lte)
    // // {difficulty: 'easy', duration: {gte: 5}}
    // // {difficulty: 'easy', duration: { $gte: 5}}

    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // // console.log(JSON.parse(queryStr));

    // let query = Tour.find(JSON.parse(queryStr)); // returns a query where you can later call other methods on eg(sort,)

    // //2 SORTING

    // // { sort: 'price' } //sorting in asc order
    // // { sort: '-price' } //sorting in desc order by mongoose
    // // sort('price ratingsAvg') multiple sorting value in mongoose

    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt'); //default sorting if no sort is added
    // }

    // // 3 FIELD LIMITING
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // // 4 PAGINATION
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // //page=2&limit=10, 1-10 page=1, 11-20 page=2
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exist'); // throw an error when data is exaughted
    // }

    //EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const tours = await features.query.explain(); // get details about query
    const tours = await features.query;
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',

      results: tours.length,
      data: {
        tours: tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   //add populate to embed the data data of referenced child
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tours: tour,
//     },
//   });
// });

// exports.createTour = async (req, res, next) => {
//   try {
//     // const newTour = new Tour({})
//     // newTour.save()

//     const newTour = await Tour.create(req.body); //create document with mongoose

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'Fail',
//       message: err,
//     });
//   }
// };

//refactor above createTour to handle erros
exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     // console.log('DELETED HERE', response);

//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'Fail',
//       message: err,
//     });
//   }
// };

// MATCHING and GROUPING PIPELINE
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          // _id: '$difficulty', // grouping stats by difficulty
          _id: { $toUpper: '$difficulty' },
          numTour: { $sum: 1 }, //sums all tours passing through the pipeline
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' }, // calc the average for ratings
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, // use the new names in the document eg avgPrice OR avgRating
      },
      // {
      //   $match: {
      //     _id: {
      //       $ne: 'EASY',
      //     },
      //   },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

//UNWIND AND PROJECT PIPELINE
exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; // converting to a num

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', //deconstruct an arrayfield and output one doc for each element of the array [eg date is a array[we get a doc for each date]]
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTouStarts: { $sum: 1 },
          tours: { $push: '$name' }, // an array for tours
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 }, // projects excludes value passed in document
      },
      {
        $sort: {
          numTouStarts: -1,
        },
      },
      {
        $limit: 12, // limits outputs
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/25.738787, -80.342415/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError('Please provide latitude in the format lat,lng.', 400));
  }

  //geospatial centersphere radius is in radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // console.log('distance', distance, 'lat:', lat, 'long:', lng, 'unit', unit);

  //filter using geospatial operator geoWithin [finds docs within a certain geometery] of a sphere
  // specify the centerSphere
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude in the format lat,lng.', 400));
  }

  // goespatial has only one aggregation ie[geoNear] and shld always be first aggregation
  // geoNear on field should have a index
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      // project to show[1]/exclude[0] only the data we want
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
