const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OrderLineSchema = require('./OrderLineSchema');
const BillSchema = require('./Bill');
const CourseSchema = require('./CourseSchema');

const OrderSchema = new Schema({
  table: Number,
  order: CourseSchema,
  date: String,
  updatedAt: String,
  customers: Number,
  status: String,
  bill: BillSchema,
});

module.exports = OrderSchema;
