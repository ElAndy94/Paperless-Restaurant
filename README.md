# Paperless Restaurant Application

An application to manage restaurant orders

## Features
* View real time table and order details
* Responsive design

### Waiter View
* Add new orders
* Edit orders
* Orders separated into courses
* Filterable and searchable menu
* Show notifications when a course is ready

### Counter View
* Display order pricing
* Apply order discount with administrator password
* View bill in print format
* View all historical orders

### Kitchen View
* Be notified of new orders and order changes
* Update status of ticket items
* Displays customer wait time

### Admin View
* Login with administrator password
* View all food item details
* Edit food items
* Add new food items

## Getting Started

These instructions will get you a copy of the project up and running on your local machine
### Prerequisites

* [Node.js and NPM](https://nodejs.org/en/)
* [Git](https://git-scm.com/)

Check Node.js is installed:
```
node -v
```
Check NPM is installed: 
```
npm -v
```

### Installing

#### MacOS/Linux

```
git clone https://github.com/NileDaley/paperless.git
cd paperless/app
npm install
```

#### Windows
```
git clone https://github.com/NileDaley/paperless.git
cd paperless\app
npm install
```

## Running

```
npm start
```

### Waiter View
Visit [localhost:3000/](http://localhost:3000/) for the waiter view

### Kitchen View
Visit [localhost:3000/kitchen](http://localhost:3000/kitchen) for the kitchen view

### Counter View
Visit [localhost:3000/counter](http://localhost:3000/counter) for the counter view

### Admin View
Visit [localhost:3000/admin](http://localhost:3000/admin) for the admin view

Login with password:
```
Admin123
```

## Built With

* [Express](https://expressjs.com/) - Node application framework used to build the server side application
* [Vue.js](https://vuejs.org/) - Client side javascript application framework 
* [Bulma](https://bulma.io) - CSS framework
* [WebSocket](https://socket.io/) - Real-time event handling

## Authors

* **[Nile Daley](https://github.com/NileDaley)** - *Waiter View*
* **[Joshua Hazelwood](https://github.com/joshhazlewood)** - *Counter View*
* **[Andrew Peliza](https://github.com/ElAndy94)** - *Admin View*
* **[James Hurley](https://github.com/JamesHurley93)** - *Kitchen View*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
