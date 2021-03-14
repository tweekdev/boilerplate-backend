const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const mainRouter = require('./main.router');
const colors = require('./colors')
require('dotenv').config();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
app.options('*', cors());
// Access-Control-Allow-Origin *
//route files
app.use(
    '/api/tweektabs/uploads/images',
    express.static(__dirname + '/uploads/images')
);
app.use(express.static(path.join('public')));


//----------------------------------------------------------------
//parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//----------------------------------------------------------------

//----------------------------------------------------------------
//routes
mainRouter(app);

//----------------------------------------------------------------

app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});



/*
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {
      console.log(error);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred.' });
});
*/

const PORT = 7000;
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9wgqh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useCreateIndex: true, useUnifiedTopology: true, useNewUrlParser: true }
  )
  .then(() => {
    console.log(colors.fg.green,`--------------------------`);
    console.log(colors.fg.green,`listening on PORT ${PORT} `);
    app.listen(PORT);
  })
  .catch((error) => {
    console.log(colors.fg.red, error);
  });
