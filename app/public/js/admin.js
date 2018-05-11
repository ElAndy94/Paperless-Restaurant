class FoodItem {
  constructor(_id, name, price, category) {
    this._id = _id;
    this.name = name;
    this.price = price;
    this.category = category;
    this.editing = false;
  }
}

const app = new Vue({
  el: '#app',
  data: {
    loginError: [],
    messages: [],
    errors: [],
    errorsEdit: [],
    foodItems: [],
    filteredFoodItems: [],
    editingRow: true,
    newItem: {
      name: '',
      price: '',
      category: 'Select Dropdown'
    },
    password: '',
    loggedIn: false
  },
  methods: {
    getFoodItems() {
      axios
        .get('/api/menu')
        .then(response => {
          let data = response.data;
          // Convert the json response to FoodItem objects and sort alphabetically
          this.filteredFoodItems = this.foodItems = data
            .map(
              item =>
                new FoodItem(item._id, item.name, item.price, item.category)
            )
            .sort((item, other) => {
              return item.name
                .toLowerCase()
                .localeCompare(other.name.toLowerCase());
            });
        })
        .catch(err => {
          console.log(err);
        });
    },

    checkFormEdit: function(item) {
      this.errorsEdit = [];
      if (!item.name) {
        this.errorsEdit.push('Name required.');
      } else if (!this.validName(item.name)) {
        this.errorsEdit.push('Valid Name required.');
      }
      if (!item.price) {
        this.errorsEdit.push('Price required.');
      } else if (!this.validPrice(item.price)) {
        this.errorsEdit.push('Valid Price required.');
      }
      if (item.category === 'Select Dropdown') {
        this.errorsEdit.push('Please select a valid category');
      }
      if (!this.errorsEdit.length) return true;
      // e.preventDefault();
    },

    checkForm: function(e) {
      this.errors = [];
      if (!this.newItem.name) {
        this.errors.push('Name required.');
      } else if (!this.validName(this.newItem.name)) {
        this.errors.push('Valid Name required.');
      }
      if (!this.newItem.price) {
        this.errors.push('Price required.');
      } else if (!this.validPrice(this.newItem.price)) {
        this.errors.push('Valid Price required.');
      }
      if (this.newItem.category === 'Select Dropdown') {
        this.errors.push('Please select a valid category');
      }
      if (!this.errors.length) return true;
      // e.preventDefault();
    },
    validName: function(name) {
      var re = /^[A-z0-9& _*-]+$/;
      return re.test(name);
    },
    validPrice: function(price) {
      var re = /^([0-9]+\.[0-9]{2})$|^([0-9]+)$/;
      return re.test(price);
    },

    addNewItem() {
      this.checkForm();
      if (!this.errors.length) {
        axios
          .post('/api/admin/new-item', this.newItem)
          .then(response => {
            this.filteredFoodItems.push(this.newItem);
            let removeIndex = this.messages.indexOf(
              this.newItem.name + ' has been added'
            );
            this.messages.push(this.newItem.name + ' has been added');
            setTimeout(() => this.clearMessage(removeIndex), 10000);
            this.newItem = {
              name: '',
              price: '',
              category: 'Select Dropdown'
            };
            console.log(response);
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        console.log(this.errors);
      }
    },

    editItem(itemToEdit) {
      let item = this.filteredFoodItems[itemToEdit];
      this.checkFormEdit(item);
      if (item.editing) {
        if (!this.errorsEdit.length) {
          axios
            .put('/api/menu', { data: item })
            .then(response => {
              let removeIndex = this.messages.indexOf(
                item.name + ' has been updated'
              );
              this.messages.push(item.name + ' has been updated');
              setTimeout(() => this.clearMessage(removeIndex), 10000);
              console.log(response);
            })
            .catch(err => {
              console.log(err);
            });
          item.editing = !item.editing;
        } else {
          console.log(this.errors);
        }
      } else {
        item.editing = !item.editing;
      }
    },

    removeItem(itemToRemove) {
      axios
        .delete('/api/menu', { data: this.foodItems[itemToRemove] })
        .then(response => {
          console.log(response);
        })
        .catch(err => {
          console.log(err);
        });

      let removeIndex = this.messages.indexOf(
        this.foodItems[itemToRemove].name + ' has been removed'
      );
      this.messages.push(
        this.foodItems[itemToRemove].name + ' has been removed'
      );
      setTimeout(() => this.clearMessage(removeIndex), 10000);
      this.filteredFoodItems.splice(itemToRemove, 1);
    },

    clearMessage(item) {
      this.messages.splice(item, 1);
    },

    checkPassword() {
      axios
        .post('/api/admin/login', { data: this.password })
        .then(foundUser => {
          this.loginError = [];
          if (!foundUser) {
            this.loginError.push('User Could Not Be Found');
          } else {
            if (this.password === foundUser['data'][0]['password']) {
              this.loggedIn = true;
            } else {
              this.loginError.push('Incorrect password, please try again.');
            }
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  },
  created: function() {
    this.getFoodItems();
    // this.loggedIn = false;
  }
});
