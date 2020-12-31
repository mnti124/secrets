//Environment Variable: stores data we do not want to be disclosed to the public
require('dotenv').config()
//jshint esversion:
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const app = express();


//Bycrypt:similar to MD5: more secure way to hash passwords. through hash function
const saltRounds = 10;

//render public folder
app.use(express.static('public'));
//use ejs to render view folder
app.set('view engine', 'ejs');
//extract information read it as url format
app.use(bodyParser.urlencoded({extended:true}));

//connecting to mongodb locally
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});
//user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//This will encryp entire DB. However, we only want to encrypt password. Specify that by using encruyptedField
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})

//Creating a model
const User = mongoose.model('User',userSchema);


app.get('/', (req,res)=>{
    res.render('home');
});

app.get('/login', (req,res)=>{
    res.render('login');
});
app.get('/register',(req,res)=>{
    res.render('register');
})

app.post('/register', function(req,res){
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
    
    
});

//Hnadle Login
app.post('/login', (req,res)=>{
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
})

app.listen(5000, ()=>{
    console.log('Listening at port 5000');
})