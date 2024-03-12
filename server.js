const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  })
  .catch((err) => console.log(`Error`, err));

/////////////// 4) START SERVER
const port = process.env.PORT || 3002;
// const server = app.listen(port, () => {
//   console.log('App running on port 3000');
// });

app.listen(port, () => {
  console.log('App running on port 3000');
});

//unhandled rejected promise => handles errors outside express like DB down
// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.messsage);
//   server.close(() => {
//     process.exit(1);
//   });
// });
