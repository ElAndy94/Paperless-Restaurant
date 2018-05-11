const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FoodItemSchema = require('./FoodItemSchema');

const OrderLineSchema = new Schema({
  quantity: Number,
  item: FoodItemSchema,
  status: {
    type: String,
    enum: ['pending', 'sent', 'cooking', 'ready', 'served']
  }
});

module.exports = OrderLineSchema;
