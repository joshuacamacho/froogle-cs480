var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var sha256 = require('sha256');
var passport = require('../passport-config');

AWS.config.update({region:'us-east-1'});

var docClient = new AWS.DynamoDB.DocumentClient();

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.send(401);
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.user) res.locals.user = req.user.Item;
    res.render('index', { title: 'Recipii Home' });
});

router.post('/users', function(req, res, next) {
  var email = req.body['username'];
  var password = req.body['password'];
  
  if(!email || !password){
  	res.status(400).send("Error registering");
  	return;
  }

  password = sha256(password);

  var params = {
    TableName:"Users",
    Item:{
        "Email": email,
        "password": password
    }
  };
  var user={};
  user.Item={
      Email: email,
      password: password
  };
  console.log("Adding a new item...");
	docClient.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data));
            req.login(user, function (err) {
                if (!err) {
                    res.redirect('/pantry');
                } else {
                    //handle error
                }
            });
	    }
	});

});

router.get('/pantry',  checkAuth, function(req, res, next) {
    res.locals.user = req.user.Item;
    res.render('pantry', { title: 'My Pantry' });
});

router.post('/login',
    passport.authenticate('local', { successRedirect: '/pantry',
        failureRedirect: '/',
        failureFlash: true })
);

router.get('/logout', function(req, res){
    res.locals.users = null;
    req.logout();
    res.redirect('/');
});

module.exports = router;
    

