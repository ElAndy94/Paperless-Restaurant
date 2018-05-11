const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BillSchema = new Schema({
    totalPreTax: Number,
    vatAmount: Number,
    totalPostTax: Number,
});

module.exports = BillSchema;
