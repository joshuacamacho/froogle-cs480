var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var sha256 = require('sha256');

AWS.config.update({region:'us-east-1'});

var docClient = new AWS.DynamoDB.DocumentClient();



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/users', function(req, res, next) {
  var email = req.body['email'];
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

  console.log("Adding a new item...");
	docClient.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	});

});

module.exports = router;
    

