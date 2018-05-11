const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FoodItemSchema = new Schema({
  name: String,
  price: String,
  category: String
});

module.exports = FoodItemSchema;
