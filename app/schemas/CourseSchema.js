const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OrderLineSchema = require('./OrderLineSchema');

const CourseSchema = new Schema({
  starters: {
    status: String,
    items: [OrderLineSchema]
  },
  mains: {
    status: String,
    items: [OrderLineSchema]
  },
  sides: {
    status: String,
    items: [OrderLineSchema]
  },
  desserts: {
    status: String,
    items: [OrderLineSchema]
  }
});

module.exports = CourseSchema;
