const userRouter = require('./user/user.router');
const express = require('express');
const router = express.Router();
module.exports = (app) => {
  //route
  app.use('/', router.get('/',  (req, res) => {
    res.send('API is running...')
  }));
  //route
  //route
  app.use('/api', router.get('/',  (req, res) => {
    res.send('API is running...')
  }));
  //route
  app.use('/api/tweektabs', router.get('/',  (req, res) => {
    res.send('API is running...')
  }));
  //route users
  app.use('/api/tweektabs/users', userRouter);

  //route 404
  app.get('*', function(req, res){
    res
        .status(404)
        .send(
             'This route does not exist !!'
        );
  });
};
