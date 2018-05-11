class Ticket {
  constructor({ _id, customers, date, updatedAt, order, status, table }) {
    this._id = _id;
    this.customers = customers;
    this.date = date;
    this.updatedAt = updatedAt;
    this.order = new Order(order);
    this.status = status;
    this.table = table;
    this.elapsed = {
      hours: null,
      minutes: null,
      seconds: null
    };
  }
}

class Order {
  constructor({ _id, starters, mains, sides, desserts }) {
    this._id = _id;
    this.starters = new Course(starters);
    this.mains = new Course(mains);
    this.sides = new Course(sides);
    this.desserts = new Course(desserts);
  }
}

class Course {
  constructor({ items, status }) {
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
    tickets: [],
    socket: null
  },
  methods: {
    getOrders() {
      return new Promise((resolve, reject) => {
        axios
          .get('/api/counter/all-orders')
          .then(response => {
            data = response['data']
              .filter(item => {
                return !['served', 'paid', 'abandoned'].includes(
                  item.status.toLowerCase()
                );
              })
              .sort((a, b) => {
                /* Sort oldest to newest */
                return moment(a.date).isAfter(moment(b.date));
              })
              .map(ticket => new Ticket(ticket));
            this.tickets = data;
            resolve();
          })
          .catch(err => reject(err));
      });
    },
    order(tableNumber) {
      const order = this.tickets.find(t => t.table === tableNumber).order;
      return order;
    },
    getCourse(course, table) {
      return this.order(table)[course];
    },
    toggleReady(tableNumber, course, dish) {
      if (dish.status === 'pending') {
        dish.status = 'ready';
      } else {
        dish.status = 'pending';
      }
      this.checkCourseStatus(tableNumber, course, dish);
    },
    checkCourseStatus(tableNumber, courseName, dish) {
      const course = this.getCourse(courseName, tableNumber);
      const ticket = this.tickets.find(t => t.table === tableNumber);

      // Find any pending orders
      const anyPending = course.items.find(item => item.status === 'pending');

      if (anyPending === undefined) {
        course.status = 'ready';
      } else if (course.status !== 'cooking') {
        course.status = 'pending';
      }

      this.updateTicket(ticket);
    },
    updateOrderTimes() {
      setInterval(() => {
        this.tickets.forEach(t => {
          const submitDate = moment(t.date);
          let timeSince = moment.duration(moment().diff(submitDate));
          t.elapsed = {
            hours: (Math.floor(timeSince.days() * 24) + timeSince.hours())
              .toString()
              .padStart(2, '0'),
            minutes: timeSince
              .minutes()
              .toString()
              .padStart(2, '0'),
            seconds: timeSince
              .seconds()
              .toString()
              .padStart(2, '0')
          };
        });
      }, 1000);
    },
    removeTicket(ticket) {
      this.tickets.splice(this.tickets.indexOf(ticket), 1);
    },
    acceptTicket(ticket) {
      ticket.status = 'cooking';
      this.updateTicket(ticket);
    },
    updateTicket(ticket) {
      axios
        .patch(`/${ticket._id}`, ticket)
        .then(response => {
          this.socket.emit('orderStateChange', ticket);
        })
        .catch(err => console.error(err));
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
    this.getOrders().then(() => {
      this.updateOrderTimes();
    });
    this.socket = io.connect();
    this.socket.on('newOrder', newOrder => {
      this.tickets.push(new Ticket(newOrder));
    });
    this.socket.on('orderStateChange', orderState => {
      const ticket = this.tickets.find(t => t._id === orderState._id);
      console.log(orderState);
      if (
        orderState.status === 'served' ||
        (orderState.status === 'abandoned' &&
          this.allCoursesServed(ticket.order))
      ) {
        this.tickets.splice(this.tickets.indexOf(ticket), 1);
      } else {
        if (!ticket) {
          this.tickets.push(new Ticket(orderState));
        } else {
          ticket.order = new Order(orderState.order);
          ticket.status = orderState.status;
          if (orderState.updatedAt) {
            ticket.updatedAt = orderState.updatedAt;
          }
        }
      }
    });
  }
});
