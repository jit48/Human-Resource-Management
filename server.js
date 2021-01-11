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
    "mongodb+srv://${process.env.ADMIN}:${process.env.PASSWORD}@cluster1.kfo01.mongodb.net/employeeDB?retryWrites=true&w=majority",
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

/*----------------------------------------------*/
/*             EMPLOYEE LOGIN                   */
/*----------------------------------------------*/
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

/*----------------------------------------------*/
/*                ADMIN LOGIN                   */
/*----------------------------------------------*/

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
/*==========================================*/

/*----------------------------------------------*/
/*                ADMIN ROUTE                   */
/*----------------------------------------------*/
app.get('/admin', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('admin');
    } else {
        res.redirect('/');
    }
});

app.post('/admin', function (req, res) {
    var teamValue = req.body.teamSearch;
    var desigValue = req.body.desigSearch;
    Employee.find({ team: teamValue }, function (err, foundEmployees) {
        if (err) {
            console.log(err);
        } else {
            if (foundEmployees) {
                res.render('search', { searchedEmployees: foundEmployees });
            }
        }
    });
});

/*==========================================*/

/*----------------------------------------------*/
/*                  LOGOUT                      */
/*----------------------------------------------*/
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

/*==========================================*/

/*----------------------------------------------*/
/*                 HOME ROUTE                   */
/*----------------------------------------------*/
app.get('/index', function (req, res) {
    if (req.isAuthenticated()) {
        var employee = req.user;
        res.render('index', { empDetail: employee });
    } else {
        res.redirect('/');
    }
});

/*==========================================*/

/*----------------------------------------------*/
/*             REGISTER ROUTE                   */
/*----------------------------------------------*/

app.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('register');
    } else {
        res.redirect('/');
    }
});

app.post('/register', function (req, res) {
    Employee.register(
        {
            username: req.body.username,
            name: req.body.name,
            designation: req.body.designation,
            team: req.body.team,
            salary: req.body.salary,
            pnumber: req.body.phnum,
        },
        req.body.password,
        function (err, employee) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/admin');
                });
            }
        }
    );
});
/*==========================================*/

/*----------------------------------------------*/
/*             ATTENDANCE ROUTE                 */
/*----------------------------------------------*/
app.get('/attendance', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('attendance', { leavecount: 0 });
    } else {
        res.redirect('/');
    }
});

app.post('/attendance', function (req, res) {
    var from = new Date(req.body.from);
    var to = new Date(req.body.to);
    var count = Math.ceil(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    Employee.findById(req.user.id, function (err, foundEmployee) {
        if (err) {
            console.log(err);
        } else {
            if (foundEmployee) {
                foundEmployee.leavefrom = req.body.from;
                foundEmployee.leaveto = req.body.to;
                foundEmployee.lcount = count;
                foundEmployee.save(function () {
                    res.render('attendance', { leavecount: count });
                });
            }
        }
    });
});

/*==========================================*/

/*----------------------------------------------*/
/*                LEAVE ROUTE                   */
/*----------------------------------------------*/
app.get('/leave', function (req, res) {
    if (req.isAuthenticated()) {
        Employee.find({ lcount: { $ne: null }, leavestatus: { $eq: null } }, function (err, foundEmployees) {
            if (err) {
                console.log(err);
            } else {
                if (foundEmployees) {
                    console.log(foundEmployees);
                    res.render('leave', { employeewithleave: foundEmployees });
                }
            }
        });
    }
});

app.post('/approve', function (req, res) {
    var username = req.body.username;
    if (req.isAuthenticated()) {
        Employee.findOne({ username: { $eq: username } }, function (err, foundEmployee) {
            if (err) {
                console.log(err);
                res.redirect('/leave');
            } else {
                if (foundEmployee) {
                    foundEmployee.leavestatus = 'approved';
                    foundEmployee.save(function () {
                        res.redirect('/leave');
                    });
                }
            }
        });
    }
});

app.post('/reject', function (req, res) {
    var username = req.body.username;
    if (req.isAuthenticated()) {
        Employee.findOne({ username: { $eq: username } }, function (err, foundEmployee) {
            if (err) {
                console.log(err);
                res.redirect('/leave');
            } else {
                if (foundEmployee) {
                    foundEmployee.leavestatus = 'rejected';
                    foundEmployee.save(function () {
                        res.redirect('/leave');
                    });
                }
            }
        });
    }
});

/*==========================================*/

/*----------------------------------------------*/
/*              ACCOUNT ROUTE                   */
/*----------------------------------------------*/
app.get('/account', function (req, res) {
    var employee = req.user;
    if (employee) {
        res.render('account', { empDetail: employee });
    }
});
/*==========================================*/



var port = 3000 || process.env.PORT;
app.listen(port, function () {
    console.log('Server has started on PORT : ' + port);
});
