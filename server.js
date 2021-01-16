require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');

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
    mail:String,
    role: String
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
                if(req.user.role == "Employee"){
                    res.redirect('/index');
                } else{
                    res.redirect('/empllogin');
                }
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
                if(req.user.role == "Admin"){
                    res.redirect('/admin');
                }
                else{
                    res.redirect("/adminlogin");
                }
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
            designation: req.body.desigSearch,
            team: req.body.teamSearch,
            salary: req.body.salary,
            pnumber: req.body.phnum,
            mail: req.body.mailId,
            role: req.body.role
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
        var employee = req.user;
        res.render('attendance', { employee: employee });
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
                foundEmployee.leavestatus = 'not alotted';
                foundEmployee.save(function () {
                    res.redirect('/attendance');
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
    const today = new Date().toISOString().slice(0, 10);
    if (req.isAuthenticated()) {
        Employee.find({ leaveto: { $lte: today } }, function (err, foundEmployees) {
            if (err) {
                console.log(err);
            } else {
                if (foundEmployees) {
                    foundEmployees.map((employee) => {
                        employee.set('lcount', undefined, { strict: false });
                        employee.set('leavefrom', undefined, { strict: false });
                        employee.set('leaveto', undefined, { strict: false });
                        employee.set('leavestatus', undefined, { strict: false });
                        employee.save();
                    });
                }
            }
        });
        Employee.find({ lcount: { $ne: null }, leavestatus: { $ne: null }, leaveto: { $gt: today } }, function (err, foundEmployees) {
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
                        var mailId = foundEmployee.mail;
                        var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: 'hackearth99@gmail.com',
                          pass: process.env.EPASSWORD
                        }
                      });
                      
                      var mailOptions = {
                        from: 'hackearth99@gmail.com',
                        to: mailId,
                        subject: 'Leave request '+foundEmployee.leavestatus,
                        text: 'Your leave request from '+foundEmployee.leavefrom+' to '+foundEmployee.leaveto+' has been '+foundEmployee.leavestatus
                      };
                      
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log("Email sent");
                        }
                      });
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
                    foundEmployee.set('lcount', undefined, { strict: false });
                    foundEmployee.set('leavefrom', undefined, { strict: false });
                    foundEmployee.set('leaveto', undefined, { strict: false });
                    foundEmployee.set('leavestatus', undefined, { strict: false });
                    foundEmployee.save(function () {
                        var mailId = foundEmployee.mail;
                        var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: 'hackearth99@gmail.com',
                          pass: process.env.EPASSWORD
                        }
                      });
                      
                      var mailOptions = {
                        from: 'hackearth99@gmail.com',
                        to: mailId,
                        subject: 'Leave request '+foundEmployee.leavestatus,
                        text: 'Your leave request from '+foundEmployee.leavefrom+' to '+foundEmployee.leaveto+' has been '+foundEmployee.leavestatus
                      };
                      
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log("Email sent");
                        }
                      });
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

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Server has started on PORT : ' + port);
});
