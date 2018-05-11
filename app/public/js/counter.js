class Item {
  constructor(name, quantity, price) {
    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }
}

class Table {
  constructor(_id, occupied = false, status, customers = 0) {
    this._id = _id;
    this.status = status;
    this.occupied = occupied;
    this.customers = customers;
  }
}

var SelectTable = {
  template:
    '<div><h2 class="has-text-centered">Select a table to see the order</h2></div>'
};

var EmptyTable = {
  template: '<div><h2 class="has-text-centered">No current order</h2></div>'
};

var app = new Vue({
  el: '#app',
  data: {
    selected: false,
    empty: false,
    showReceipt: false,
    orderHistory: false,
    showHide: 'Show',
    showHideOrder: 'Show',
    selectedTable: null,
    socket: null,
    currentBill: {
      orderNo: 0,
      tableNo: 0,
      totalPostTax: 0,
      vatAmount: 0,
      totalPreTax: 0,
      order: [],
      status: ''
    },
    existingOrders: [],
    paidOrders: [],
    tables: [],
    discount: '',
    adminPass: '',
    errors: []
  },

  components: {
    'select-table': SelectTable,
    'empty-table': EmptyTable
  },

  methods: {
    showTableOrder(tableNo) {
      this.errors = [];
      this.empty = false;
      this.currentBill.tableNo = tableNo;

      let currentTable = [];
      currentTable = this.existingOrders.filter(order => {
        return order['table'] === tableNo;
      });

      if (currentTable.length === 0) {
        this.selected = true;
        this.empty = true;
      } else {
        const extractedItems = this.extractItemsFromCourses(
          currentTable[0].order
        );

        this.currentBill.orderNo = currentTable[0]._id;
        this.currentBill.order = extractedItems;
        this.currentBill.status = currentTable[0].status;

        this.calculatePostTax();
        this.calculateVAT();
        this.calculatePreTax();
        this.selected = true;
      }
    },

    calculatePostTax() {
      let total = 0;
      this.currentBill.order.forEach(element => {
        const itemTotal = element.quantity * element.price;
        total += itemTotal;
      });
      this.currentBill.totalPostTax = total;
      console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
    },

    calculateVAT() {
      const vat = this.currentBill.totalPostTax * 0.2;
      this.currentBill.vatAmount = vat;
    },

    calculatePreTax() {
      const total = this.currentBill.totalPostTax - this.currentBill.vatAmount;
      this.currentBill.totalPreTax = total;
    },

    completeOrder() {
      payload = {
        bill: {
          totalPreTax: this.currentBill.totalPreTax,
          vatAmount: this.currentBill.vatAmount,
          totalPostTax: this.currentBill.totalPostTax
        },
        status: 'paid'
      };

      axios
        .patch(`/api/counter/${this.currentBill.orderNo}`, payload)
        .then(response => {
          let updatedOrder = response['data'];
          this.socket.emit('orderStateChange', updatedOrder);
        })
        .catch(err => console.log(err));
    },

    getOrders() {
      axios
        .get('/api/counter/all-orders')
        .then(response => {
          let allOrders = response['data'];
          this.existingOrders = allOrders.filter(
            o => o.status !== 'paid' && o.status !== 'abandoned'
          );

          this.existingOrders.forEach(order => {
            let orderTable = this.tables.find(t => t._id === order.table);
            orderTable.occupied = true;
            orderTable.customers = order.customers;
            orderTable.status = order.status;
          });
        })
        .catch(err => console.log(err));
    },

    extractItemsFromCourses(order) {
      // Extract all items from each of the courses
      let items = [];
      for (let course of ['starters', 'mains', 'sides', 'desserts']) {
        if (order[course].items.length !== 0) {
          order[course].items.forEach(x => {
            let name = x['item'].name;
            let quantity = x.quantity;
            let price = x['item'].price;
            items.push(new Item(name, quantity, price));
          });
        }
      }
      return items;
    },

    selectedAndNotEmpty() {
      let bool = false;

      if (!this.empty && this.selected) {
        bool = true;
      }

      return bool;
    },

    resetCurrentBill() {
      this.currentBill.orderNo = '';
      this.currentBill.tableNo = '';
      this.currentBill.totalPreTax = 0;
      this.currentBill.vatAmount = 0;
      this.currentBill.totalPostTax = 0;
      this.currentBill.order = [];
      this.currentBill.status = '';
    },

    createTables() {
      const TABLES = 6;
      for (let i = 1; i <= TABLES; i++) {
        this.tables.push(new Table(i));
      }
    },

    applyDiscount() {
      this.errors = [];

      if (!this.adminPass) {
        this.errors.push('Please enter an admin password');
      }

      if (!this.discount || this.discount > 100 || this.discount < 1) {
        this.errors.push('Please enter a valid discount %');
      }

      if (this.adminPass && this.discount) {
        axios
          .post('/api/admin/login', { data: this.adminPass })
          .then(foundUser => {
            if (!foundUser) {
              this.errors.push('User Could Not Be Found');
            } else {
              if (this.adminPass === foundUser['data'][0]['password']) {
                this.currentBill.totalPostTax =
                  this.currentBill.totalPostTax -
                  this.currentBill.totalPostTax * (this.discount / 100);
                this.adminPass = '';
                this.discount = null;
              } else {
                this.errors.push('Incorrect Password!');
              }
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
    },

    getCurrentTime() {
      return moment().format('MMMM Do YYYY, h:mm:ss a');
    },

    receiptToggle() {
      if (this.showHide === 'Show') {
        this.showHide = 'Hide';
      } else {
        this.showHide = 'Show';
      }
      this.showReceipt = !this.showReceipt;
    },

    orderHistoryToggle() {
      if (this.showHideOrder === 'Show') {
        this.showHideOrder = 'Hide';
        this.showOrderHistory();
      } else {
        this.showHideOrder = 'Show';
      }
      this.orderHistory = !this.orderHistory;
    },

    showOrderHistory() {
      axios
        .get('/api/counter/all-orders')
        .then(response => {
          let allOrders = response['data'];

          this.paidOrders = allOrders
            .filter(o => o.status === 'paid')
            .sort((a, b) => {
              return moment(a.date).isBefore(moment(b.date));
            });

          this.paidOrders.forEach(order => {
            let items = this.extractItemsFromCourses(order.order);
            order.order = items;
          });
          console.log(this.paidOrders);
        })
        .catch(err => console.log(err));
    }
  },

  computed: {
    capitalizeFirstLetter: function() {
      return (
        this.currentBill.status.charAt(0).toUpperCase() +
        this.currentBill.status.slice(1)
      );
    }
  },

  created: function() {
    this.getOrders();
    this.currentBill.tableNo = 0;
    this.createTables();

    this.socket = io.connect();
    this.socket.on('newOrder', newOrder => {
      const table = this.tables.find(t => t._id === newOrder.table);

      table.status = newOrder.status;
      table.customers = newOrder.customers;
      table.occupied = true;

      this.existingOrders.push(newOrder);

      if (this.currentBill.tableNo === newOrder.table) {
        this.showTableOrder(newOrder.table);
      }
    });

    this.socket.on('orderStateChange', order => {
      const orderToUpdate = this.existingOrders.find(
        t => t.table === order.table
      );
      const table = this.tables.find(t => t._id === order.table);

      if (order.status === 'abandoned' || order.status === 'paid') {
        //  Reset the table and remove order from existing orders
        table.customers = 0;
        table.occupied = false;
        table.status = '';
        this.existingOrders.splice(
          this.existingOrders.indexOf(orderToUpdate),
          1
        );
        this.showTableOrder(order.table);
      } else {
        //  Update the order info
        orderToUpdate.order = order.order;
        orderToUpdate.status = order.status;
        table.status = order.status;
        table.customers = order.customers;
        this.showTableOrder(order.table);
      }
    });
  }
});
