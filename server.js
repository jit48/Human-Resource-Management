require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(
    `mongodb+srv://${process.env.ADMIN}:${process.env.PASSWORD}@cluster1.kfo01.mongodb.net/employeeDB?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
);



const employeeSchema = new mongoose.Schema({
    username: String,
    employeeId: Number,
    name: String,
    designation: String,
    team: String,
    salary: Number,
    pnumber: Number,
    leavefrom: String,
    leaveto: String,
    lcount: Number,
    leavestatus: String,
});

employeeSchema.plugin(passportLocalMongoose);

const Employee = new mongoose.model('Employee', employeeSchema);

passport.use(Employee.createStrategy());

passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

app.get('/', function (req, res) {
    res.render('login');
});

/*      EMPLOYEE LOGIN AND REGISTER     */

app.get('/empllogin', function (req, res) {
    res.render('empllogin');
});

app.post('/empllogin', function (req, res) {
    const employee = new Employee({
        username: req.body.username,
        employeeId: req.body.password,
    });

    req.login(employee, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/index');
            });
        }
    });
});

/*==========================================*/

/*      ADMIN LOGIN     */

app.get('/adminlogin', function (req, res) {
    res.render('adminlogin');
});

app.post('/adminlogin', function (req, res) {
    const employee = new Employee({
        username: req.body.username,
        employeeId: req.body.password,
    });

    req.login(employee, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/admin');
            });
        }
    });
});

app.get('/admin', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('admin');
    } else {
        res.redirect('/');
    }
});

/*==========================================*/

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/index', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('index');
    } else {
        res.redirect('/');
    }
});

app.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('register');
    } else {
        res.redirect('/');
    }
});

app.post('/register', function (req, res) {
    Employee.register({ username: req.body.username, name: req.body.name }, req.body.password, function (err, employee) {
        if (err) {
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/admin');
            });
        }
    });
});

app.get('/attendance', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('attendance');
    } else {
        res.redirect('/');
    }
});

app.post('/attendance', function (req, res) {
    var from = req.body.from;
    var to = req.body.to;
    var count = req.body.count;
    Employee.findById(req.user.id, function (err, foundEmployee) {
        if (err) {
            console.log(err);
        } else {
            if (foundEmployee) {
                foundEmployee.leavefrom = from;
                foundEmployee.leaveto = to;
                foundEmployee.lcount = count;
                foundEmployee.save(function () {
                    res.redirect('/attendance');
                });
            }
        }
    });
});

app.get('/home', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('index');
    } else {
        res.redirect('/');
    }
});

app.get('/leave', function (req, res) {
    if (req.isAuthenticated()) {
        Employee.find({ lcount: { $ne: null } }, function (err, foundEmployees) {
            if (err) {
                console.log(err);
            } else {
                if (foundEmployees) {
                    res.render('leave', { employeewithleave: foundEmployees });
                }
            }
        });
    }
});

app.post('/leave', function (req, res) {});

let port = process.env.PORT;
if (port == null || port == '') {
    port = 3000;
}

app.listen(port, function () {
    console.log('Server has started');
});
