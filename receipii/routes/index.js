var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var sha256 = require('sha256');
var passport = require('../passport-config');
var elasticsearch = require('elasticsearch');

AWS.config.update({region:'us-east-1'});

var docClient = new AWS.DynamoDB.DocumentClient();
var esClient = new elasticsearch.Client({
    host: 'https://search-recipii-n4zq5wv364fpot4gkwft43wzbm.us-west-1.es.amazonaws.com',
    log: 'trace'
});

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

router.get('/pantry', checkAuth, function(req, res, next) {
    res.locals.user = req.user.Item;
    var params = {
        "RequestItems" : {
            "Recipes": {
                "Keys": []
            }
        }
    };
    if(req.user.Item.submitted_recipes){
        req.user.Item.submitted_recipes.values.forEach(function(element){
            params.RequestItems.Recipes.Keys.push({"Recipe":element});
        });
    }
    docClient.batchGet(params, function(err, data) {
        console.log('error: '+ err);
        // console.log(jsDump.parse(data));
        res.render('pantry', {
            title: 'My Pantry',
            submitted: data.Responses.Recipes
        });
    });

});

router.get('/submit', checkAuth, function(req, res, next) {
    res.locals.user = req.user.Item;
    res.render('submit', { title: 'Recipe Submit' });
});

router.post('/submit', checkAuth, function(req, res, next) {
    res.locals.user = req.user.Item;
    var recipe = req.body;
    recipe.user = res.locals.user;
    var params = {
        TableName: "Recipes",
        Item: recipe
    };
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data));

            // res.redirect('/pantry');

        }
    });
    res.json({});
});

router.post('/login',
    passport.authenticate('local', { successRedirect: '/pantry',
        failureRedirect: '/'})
);

router.get('/logout', function(req, res){
    res.locals.users = null;
    req.logout();
    res.redirect('/');
});

router.get('/clearIndex', function(req, res){

});

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

router.get('/recipeIndex', function(req, res){
    var params = {
        TableName: "Recipes",
        Limit:"100"
    };
    docClient.scan(params, onScan);
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // print all the movies
            console.log("Scan succeeded.");
            res.json(data.Items);
            var idCount=0;
            data.Items.forEach(function(recipe) {
                if(IsJsonString(recipe.ingredients))
                recipe.ingredients = JSON.parse(recipe.ingredients);
                if(IsJsonString(recipe.steps))
                recipe.steps=JSON.parse(recipe.steps);
                esClient.create({
                    index: 'recipii',
                    type: 'recipe',
                    id: idCount.toString(),
                    body: recipe
                }, function (error, response) {
                    // ...
                });
                idCount++;
            });

            // continue scanning if we have more movies, because
            // scan can retrieve a maximum of 1MB of data
            // if (typeof data.LastEvaluatedKey != "undefined") {
            //     console.log("Scanning for more...");
            //     params.ExclusiveStartKey = data.LastEvaluatedKey;
            //     docClient.scan(params, onScan);
            // }
        }
    }
});

router.get('/recipe', function(req, res){
    var name = req.query.name;
    var params = {
        TableName: "Recipes",

    };

    if(name){
        params.Key={
            "Recipe": name
        };

        docClient.get(params, function(err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                res.json(data.Item);
            }
        });

    }else if(req.query.amount){
        var amount = req.query.amount;
        params.Limit=amount;
        docClient.scan(params, onScan);

        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                // print all the movies
                console.log("Scan succeeded.");
                res.json(data.Items);
                // data.Items.forEach(function(movie) {
                //
                // });

                // continue scanning if we have more movies, because
                // scan can retrieve a maximum of 1MB of data
                // if (typeof data.LastEvaluatedKey != "undefined") {
                //     console.log("Scanning for more...");
                //     params.ExclusiveStartKey = data.LastEvaluatedKey;
                //     docClient.scan(params, onScan);
                // }
            }
        }
    }




});

router.get('/recipeSearch', function(req, res, next) {
    var queryObj={
        query:{
            bool:{
                should:[]
            }
        },
        size:100
    };
    req.query.terms.forEach(function(item){
        queryObj.query.bool.should.push({
           wildcard:{
               "ingredients.name": "*"+item.tag.toLowerCase()+"*"
           }
        });
    });

    esClient.search({
       index:"recipii",
        type:"recipe",
        body: queryObj
    }).then(function(response){
       console.log(response);
       var results = response.hits;
       res.json(results);
    });
});

router.get('/ingredient', function(req, res){
    var name = req.query.name;
    var params = {
        TableName: "Ingredients",
        Ingredient: name
    };



    params.Key={
        "Ingredient": name
    };






        docClient.get(params, function(err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                res.json(data.Item);
            }
        });
});

module.exports = router;
    

