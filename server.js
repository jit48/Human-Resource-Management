const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://jit-admin:jithello28@cluster1.kfo01.mongodb.net/employeeDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

const employeeSchema = new mongoose.Schema({
    username: String,
    employeeId: Number
});

employeeSchema.plugin(passportLocalMongoose);

const Employee = new mongoose.model("Employee", employeeSchema);

passport.use(Employee.createStrategy());
 
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

app.get("/", function(req, res){
    res.render("login");
});

app.get("/empllogin", function(req, res){
    res.render("empllogin");
});

app.post("/empllogin", function(req, res){
    const employee = new Employee({
        username: req.body.username,
        employeeId: req.body.password
    });

    req.login(employee, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/index");
            });
        }
    })
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/index", function(req, res){
    if(req.isAuthenticated()){
        res.render("index");
    } else {
        res.redirect("/");
    }
})

app.post("/register", function(req, res){
    Employee.register({username: req.body.username}, req.body.password, function(err, employee){
        if(err){
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/index");
            });
        }
    });
});

app.get("/attendance", function(req, res){
    if(req.isAuthenticated()){
        res.render("attendance");
    }else{
        res.redirect("/");
    }
});

app.post("/attendance", function(req, res){
        console.log(req.body.present);
        console.log(req.body.absent);
});

app.get("/home", function(req ,res){
    if(req.isAuthenticated()){
        res.render("index");
    }else{
        res.redirect("/");
    }
});

app.get("/adminlogin", function(req, res){
    res.render("adminlogin");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("Server has started");
});