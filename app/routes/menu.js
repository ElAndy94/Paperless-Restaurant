const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FoodItemSchema = require('../schemas/FoodItemSchema');
const FoodItem = mongoose.model('FoodItem', FoodItemSchema);

router.get('/', (req, res, next) => {
  FoodItem
    .find()
    .then(data => {
      res.json(data);
    })
    .catch(err => res.send(err));
});

router.get('/:id', (req, res, next) => {
  FoodItem
    .findById(req.params.id)
    .then(data => res.json(data))
    .catch(err => res.send(err));
});

//Remove item working now
router.delete('/', function (req, res) {
  let itemToRemove = req.body;
  let FoodItem = mongoose.model('FoodItem', FoodItemSchema);
  FoodItem
    .findByIdAndRemove(itemToRemove._id)
    .then(response => {
      res.send(response);
    })
    .catch(err => res.send(err));
})

router.put('/', function (req, res) {
  let itemToEdit = req.body.data;
  let FoodItem = mongoose.model('FoodItem', FoodItemSchema);
  FoodItem
    .findByIdAndUpdate(itemToEdit._id, itemToEdit)
    .then(response => {
      res.send('Menu item updated');
    })
    .catch(err => res.send(err));
})

module.exports = router;