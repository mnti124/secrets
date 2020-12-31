//Environment Variable: stores data we do not want to be disclosed to the public
require('dotenv').config()
//jshint esversion:
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
//const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();


//Bycrypt:similar to MD5: more secure way to hash passwords. through hash function
//const saltRounds = 10;

//render public folder
app.use(express.static('public'));
//use ejs to render view folder
app.set('view engine', 'ejs');
//extract information read it as url format
app.use(bodyParser.urlencoded({extended:true}));


//Creatingg a cookie session
app.use(session({
    secret: 'our lil secret',
    resave: false,
    saveUninitialized: false
}))

//Initialize passort to use it for auth
app.use(passport.initialize());
//Set up passoort to deal with current session
app.use(passport.session());


//connecting to mongodb locally
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
//user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//Using passportLocalMongoose to hash+salt user's password and save it in the mongodb DB
userSchema.plugin(passportLocalMongoose);

//This will encryp entire DB. However, we only want to encrypt password. Specify that by using encruyptedField
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})

//Creating a model
const User = mongoose.model('User',userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', (req,res)=>{
    res.render('home');
});

app.get('/login', (req,res)=>{
    res.render('login');
});
app.get('/register',(req,res)=>{
    res.render('register');
})

app.get('/secrets',(req,res)=>{
    //Check if user is authenticated, through passport,passport-local-mongoose and session: 
    //if user is already logged in, then just render secret page, even after leaving the current page: the session is saved
    //else redirect to login page
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login')
    }
})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/')
})

app.post('/register', function(req,res){
    /*
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        //saving new user in db
        newUser.save((err)=>{
            if(!err){
                //if there is no error after logging in render secret page
                res.render('secrets');
            }else{
                console.log(err);
            }
        });
    });
    */
    //Using register method coming from passport-local-mongoose to create new user, store it database and authenticate them
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect('/register')
        }else{
            //authenticate checks if user was properly saved and if that user was created for the first time
            //if true then redirecct user to secrets page
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets')
            })
        }
    })
    
});

//Hnadle Login
app.post('/login', (req,res)=>{
    /*
    //username and password captured from login form in login.ejs
    const username = req.body.username;
    const password = req.body.password;
    //check if such user is aloready in database
    User.findOne({email: username}, (err, foundUser)=>{
        if(err){
            //such user is not in the database
            console.log(err);
        }else{
            //if there is a object of foundUser which is not null
            if(foundUser){
                // if(foundUser.password === password){
                //     console.log(password)
                //     //if user's password matches the password in database then render secrets page
                //     res.render('secrets');
                // }
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    // result == true
                    if(result === true){
                        res.render('secrets');
                    }
                });
            }
        }
    })
    */

    //storing user credentials when they put their info
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    //utilizing login function from passport to check if such user exist in DB:
    //if user exist then authenticate them:check if they have an on going session from a coookie
    //if true then to secret page
    req.login(user, (err)=>{
        //using authenticate method to check if user exist in database: store as cookie
        passport.authenticate('local')(req,res,(err)=>{
            //successfully logged in
            res.redirect('/secrets')
        })
    })
})

app.listen(5000, ()=>{
    console.log('Listening at port 5000');
})