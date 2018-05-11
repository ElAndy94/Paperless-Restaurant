const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const counter = require('./counter.js');
const kitchen = require('./kitchen.js');
const admin = require('./admin.js');
const menu = require('./menu.js');

mongoose.connect('mongodb://admin:password@ds247078.mlab.com:47078/paperless');
mongoose.Promise = global.Promise;

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log("Connected to mongodb via mongoose..."));

router.use('/counter', counter);
router.use('/kitchen', kitchen);
router.use('/admin', admin);
router.use('/menu', menu);

module.exports = router;