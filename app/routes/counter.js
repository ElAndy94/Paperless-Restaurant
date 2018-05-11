const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const OrderSchema = require('../schemas/OrderSchema');
const OrderLineSchema = require('../schemas/OrderLineSchema');
const FoodItemSchema = require('../schemas/FoodItemSchema');

const FoodItem = mongoose.model('FoodItem', FoodItemSchema);
const OrderLine = mongoose.model('OrderLine', OrderLineSchema);
const Order = mongoose.model('Order', OrderSchema);

/* GET users listing. */
router.get('/all-orders', (req, res, next) => {
  Order
    .find()
    .then(data => {
      res.json(data);
    })
    .catch(err => res.send(err));
});

router.post('/complete-order', (req, res) => {
  const orderToSave = req.body;
  Order.create(orderToSave, (err) => {
    if (err) {
      console.log('Error Inserting Order #' + orderToSave.orderNo);
    } else {
      res.send('Order #' + orderToSave.orderNo + ' saved to orders collection')
      console.log('Order #' + orderToSave.orderNo + ' saved to orders collection');
    }
  });

});

router.patch('/:id', (req, res) => {

  let { bill, status } = req.body;
  // console.log(req.body);
  console.log(status);
  console.log(bill);

  Order.findByIdAndUpdate(req.params.id,
      {
        $set: {
          bill,
          status
        }
      }, {'new': true})
      .then(response => {
        res.statusCode = 200;
        res.json(response);
      })
      .catch(err => {
        res.statusCode = 500;
        res.json(err);
      });

});

module.exports = router;