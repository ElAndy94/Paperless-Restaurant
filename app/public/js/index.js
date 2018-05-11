class Table {
  constructor(tableNumber) {
    this.number = tableNumber;
    this.customers = 0;
    this.ticket = new Ticket();
  }
}

class Ticket {
  constructor(_id = null, status = 'free', date = null, order = new Order()) {
    this._id = _id;
    this.status = status;
    this.date = date;
    this.order = order;
  }
}

class Order {
  constructor(
    _id = null,
    starters = new Course(),
    mains = new Course(),
    sides = new Course(),
    desserts = new Course()
  ) {
    this._id = _id;
    this.starters = starters;
    this.mains = mains;
    this.sides = sides;
    this.desserts = desserts;
  }
}

class Course {
  constructor(items = [], status = 'pending') {
    this.status = status;
    this.items = items.map(i => new OrderItem(i));
  }
}

class OrderItem {
  constructor({ _id, item, quantity, status }) {
    this._id = _id;
    this.item = new FoodItem(item);
    this.quantity = quantity;
    this.status = status;
  }
}

class FoodItem {
  constructor({ _id, name, category, price }) {
    this._id = _id;
    this.name = name;
    this.category = category;
    this.price = price;
  }
}

var app = new Vue({
  el: '#app',
  data: {
    currentTable: null,
    tables: [],
    foodItems: [],
    filteredFoodItems: [],
    foodCategory: 'all',
    searchCriteria: '',
    socket: null
  },
  computed: {
    ticket: function() {
      return this.currentTable.ticket;
    },
    order: function() {
      return this.ticket.order;
    },
    starters: function() {
      return this.order.starters;
    },
    mains: function() {
      return this.order.mains;
    },
    sides: function() {
      return this.order.sides;
    },
    desserts: function() {
      return this.order.desserts;
    },
    emptyOrder: function() {
      return (
        this.starters.items.length === 0 &&
        this.mains.items.length === 0 &&
        this.sides.items.length === 0 &&
        this.desserts.items.length === 0
      );
    },
    pendingOrder: function() {
      return this.currentTable.ticket.status === 'pending';
    }
  },
  methods: {
    createTables() {
      const TABLES = 6;
      for (let i = 1; i <= TABLES; i++) {
        this.tables.push(new Table(i));
      }
    },
    getFoodItems() {
      axios
        .get('/api/menu')
        .then(response => {
          let data = response.data;
          // Convert the json response to FoodItem objects and sort alphabetically
          this.filteredFoodItems = this.foodItems = data
            .map(item => new FoodItem(item))
            .sort((item, other) => {
              return item.name
                .toLowerCase()
                .localeCompare(other.name.toLowerCase());
            });
        })
        .catch(err => console.log(err));
    },
    getExistingOrders() {
      axios
        .get('/api/counter/all-orders')
        .then(response => {
          let allOrders = response['data'];
          let existingOrders = allOrders.filter(
            o => o.status !== 'paid' && o.status !== 'abandoned'
          );

          existingOrders.forEach(order => {
            let orderTable = this.tables.find(t => t.number === order.table);
            orderTable.occupied = true;
            orderTable.customers = order.customers;
            // orderTable.order.status = order.status;
            // orderTable.order._id = order._id;
            // orderTable.order.items = this.extractItemsFromCourses(order);
            let ticket = new Ticket(
              order._id,
              order.status,
              order.date,
              order.order
            );

            orderTable.ticket = new Ticket(
              order._id,
              order.status,
              order.date,
              order.order
            );
          });
        })
        .catch(err => console.log(err));
    },
    selectTable(table) {
      this.currentTable = table;
    },
    addCustomer() {
      this.currentTable.customers += 1;
    },
    removeCustomer() {
      if (this.currentTable.customers > 0) {
        this.currentTable.customers -= 1;
      }
    },
    isOccupied(tableNumber) {
      return this.tables.find(t => t.number === tableNumber).customers > 0;
    },
    resetFilters() {
      this.foodCategory = 'all';
      this.searchCriteria = '';
      this.filteredFoodItems = this.foodItems;
    },
    setCategory(category) {
      this.foodCategory = category;
      this.filterFoodItems(this.foodCategory, this.searchCriteria);
    },
    filterFoodItems(category, criteria) {
      this.filteredFoodItems = this.foodItems;

      if (category !== 'all') {
        this.filteredFoodItems = this.filteredFoodItems.filter(item => {
          return item.category === category;
        });
      }

      if (criteria !== '') {
        this.filteredFoodItems = this.filteredFoodItems.filter(item => {
          return item.name.toLowerCase().includes(criteria.toLowerCase());
        });
      }
    },
    addItemToOrder(foodItem) {
      if (this.currentTable.ticket.status === 'free') {
        this.currentTable.ticket.status = 'pending';
      }
      if (this.pendingOrder) {
        const course = this[`${foodItem.category}s`];
        course.status = 'pending';
        if (course.items.length > 0) {
          const courseItem = course.items.find(
            orderItem => orderItem.item._id === foodItem._id
          );
          if (courseItem === undefined) {
            course.items.push(
              new OrderItem({
                _id: null,
                item: foodItem,
                quantity: 1,
                status: 'pending'
              })
            );
          } else {
            courseItem.quantity++;
          }
        } else {
          course.items.push(
            new OrderItem({
              _id: null,
              item: foodItem,
              quantity: 1,
              status: 'pending'
            })
          );
        }
      }
    },
    removeItemFromOrder(foodItem) {
      const course = this[`${foodItem.category}s`];
      const courseItem = course.items.find(
        orderItem => orderItem.item === foodItem
      );
      courseItem.quantity--;
      if (courseItem.quantity <= 0) {
        course.items.splice(course.items.indexOf(courseItem), 1);
      }
    },
    submitOrder() {
      if (this.currentTable.customers > 0 && this.pendingOrder) {
        const payload = this.getOrderPayload();

        if (this.ticket._id === null) {
          axios
            .post('/', payload)
            .then(response => {
              if (response.status === 201) {
                let submittedOrder = response['data'];

                // Update the table's order
                this.ticket._id = submittedOrder._id;
                this.ticket.status = 'Sent';

                // Tell the other parts of the system about the new order
                this.socket.emit('newOrder', submittedOrder);
              }
            })
            .catch(err => console.log(err));
        } else {
          payload.status = 'Sent';
          this.updateOrder(payload);
        }
      }
    },
    updateOrder(payload) {
      axios
        .patch(`/${this.ticket._id}`, payload)
        .then(response => {
          console.log(response);
          let updatedOrder = response['data'];
          this.ticket.status = updatedOrder.status;
          this.socket.emit('orderStateChange', updatedOrder);
        })
        .catch(err => console.log(err));
    },
    getOrderPayload() {
      return {
        table: this.currentTable.number,
        customers: this.currentTable.customers,
        order: this.currentTable.ticket.order,
        date: this.currentTable.ticket.date
      };
    },
    serveCourse(course) {
      this[course].status = 'served';
      this[course].items.forEach(i => {
        i.status = 'served';
      });

      this.ticket.status = this.allCoursesServed(this.ticket.order)
        ? 'served'
        : this.ticket.status;

      let payload = this.getOrderPayload();
      payload.status = this.ticket.status;
      console.log(payload);
      this.updateOrder(payload);
    },
    editOrder() {
      this.ticket.status = 'pending';
    },
    clearTable() {
      let payload = this.getOrderPayload();
      payload.status = 'abandoned';
      this.updateOrder(payload);
    },
    anyCourseReady(table) {
      let anyReady = false;
      ['starters', 'mains', 'sides', 'desserts'].forEach(course => {
        if (table.ticket.order[course].status === 'ready') {
          anyReady = true;
        }
      });
      return anyReady;
    },
    getTableClass(table) {
      // Highlight tables which have courses waiting to be served
      if (this.anyCourseReady(table)) {
        return 'is-danger';
      } else {
        let className;
        if (table.customers > 0) {
          className = 'is-info';
        }

        switch (table.ticket.status) {
          case 'cooking':
            className = 'is-warning';
            break;
          case 'served':
            className = 'is-success';
        }

        return className;
      }
    },
    allCoursesServed(order) {
      let remainingCourses = 0;
      ['starters', 'mains', 'sides', 'desserts'].forEach(course => {
        if (
          order[course].items.length > 0 &&
          order[course].status !== 'served'
        ) {
          remainingCourses++;
        }
      });
      return remainingCourses === 0;
    }
  },
  created: function() {
    this.createTables();
    this.getFoodItems();
    this.getExistingOrders();

    this.socket = io.connect();
    this.socket.on('orderStateChange', order => {
      const table = this.tables.find(t => t.number === order.table);

      if (order.status === 'paid' || order.status === 'abandoned') {
        // Reset the table
        table.customers = 0;
        table.ticket = new Ticket();
        table.occupied = false;
      } else {
        table.ticket = order;
      }
    });
  }
});
