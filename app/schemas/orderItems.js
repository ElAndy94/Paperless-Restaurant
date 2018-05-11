const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemsSchema = new Schema({
    item: String,
    quantity: Number,
    price: Number
});

module.exports = orderItemsSchema;