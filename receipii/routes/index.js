var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var sha256 = require('sha256');
var passport = require('../passport-config');
var elasticsearch = require('elasticsearch');
var multer = require('multer');
var moment = require('moment');
AWS.config.update({region:'us-east-1'});

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var s3 = new AWS.S3();
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
        params.RequestItems.Recipes.Keys=[];
        if(req.user.Item.favorite_recipes){
            req.user.Item.favorite_recipes.forEach(function(element){
                params.RequestItems.Recipes.Keys.push({"Recipe":element});
            });
        }
        var sub;
        if(err) sub={};
        else sub=data.Responses.Recipes;
        docClient.batchGet(params, function(err, d) {
            var fav;
            if(err) fav={};
            else fav= d.Responses.Recipes;
            res.render('pantry', {
                title: 'My Pantry',
                submitted: sub,
                favorites: fav
            });
        });

    });

});

router.get('/submit', checkAuth, function(req, res, next) {
    res.locals.user = req.user.Item;
    res.render('submit', { title: 'Recipe Submit' });
});

router.post('/submit', checkAuth, upload.any(), function(req, res, next) {
        res.locals.user = req.user.Item;
        var recipe = JSON.parse(req.body.recipe);
        recipe.user = res.locals.user;
        var imageName=sha256(req.files[0].originalname)+ new moment().format("DD_MM_YY_hh_mm_ss")+".jpg";
        var params = {
            Body: req.files[0].buffer,
            Bucket: "recipiis",
            Key: imageName,
            ContentType:req.files[0].mimetype
        };
        s3.putObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            recipe.recipe_photo="https://s3.us-east-2.amazonaws.com/recipiis/"+imageName;
            var params = {
                TableName: "Recipes",
                Item: recipe
            };
            docClient.put(params, function(err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data));
                    var recipeNames = res.locals.user.submitted_recipes.values;
                    recipeNames.push(recipe.Recipe);
                    var params = {
                        TableName:"Users",
                        Key:{
                            "Email": res.locals.user.Email
                        },
                        UpdateExpression: "set ingredients = :f",
                        ExpressionAttributeValues:{
                            ":f":recipeNames
                        }
                    };
                    docClient.put(params, function(err, data) {
                        console.log(err);
                    });
                    // res.redirect('/pantry');

                }
            });
            res.json({});
        });



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
    var allItems=[];
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            data.Items.forEach(function(d){
                allItems.push(d);
            });

            // continue scanning if we have more movies, because
            // scan can retrieve a maximum of 1MB of data
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }else{

                var idCount=0;
                allItems.forEach(function(recipe) {
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
                // print all the movies
                console.log("Scan succeeded.");
                res.json(data.Items);
            }
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
                if(req.user && req.user.Item.favorite_recipes){
                    if(req.user.Item.favorite_recipes.includes(name)){
                        data.Item.isFavorite=true;
                    }else{
                        data.Item.isFavorite=false;
                    }
                }
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
    var queryObj;
    if(req.query.terms){
        queryObj={
            query:{
                bool:{
                    should:[]
                }
            },
            size:100
        };
        req.query.terms.forEach(function(item){
            var split = item.tag.split(" ");
            split.forEach(function(part){
                queryObj.query.bool.should.push({
                   wildcard:{
                       "ingredients.name": "*"+part.toLowerCase()+"*"
                   }
                });
            });
        });
    }else{
        queryObj={
            query:{
                match_all:{}
            },
            size:50
        }
    }

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

router.post('/ingredient',checkAuth, function(req, res){
    var ingredients=[];
    req.body.forEach(function(item){
       ingredients.push(item.tag);
    });

    var params = {
        TableName:"Users",
        Key:{
            "Email": req.user.Item.Email,
        },
        UpdateExpression: "set ingredients = :f",
        ExpressionAttributeValues:{
            ":f":ingredients
        }
    };

    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
        res.json({});
    });
});

router.get('/userIngredients',function(req,res){
   var ingredients = req.user.Item.ingredients || [];
   res.json({ingredients:ingredients});
});

router.get('/allIngredients', function(req, res){
    var queryObj={
        query:{
            match:{
                "_id":0
            }
        }
    };
    esClient.search({
        index:"recipii",
        type:"ingredient",
        body: queryObj
    }).then(function(response){
        var results = response.hits;
        res.json(results);
    });
});

router.post('/favorite', checkAuth, function(req, res){
    var action=req.body.action;
    var name=req.body.name;
    var favorites = [];
    if (req.user.Item.favorite_recipes) {
        req.user.Item.favorite_recipes.forEach(function (item) {
            favorites.push(item);
        });
    }
    if(action=="add") {
        if(!favorites.includes(name)) favorites.push(name);
    }else if(action=="remove") {
        favorites.splice(favorites.indexOf(name),1);
    }

    var params = {
        TableName:"Users",
        Key:{
            "Email": req.user.Item.Email,
        },
        UpdateExpression: "set favorite_recipes = :f",
        ExpressionAttributeValues:{
            ":f":favorites
        }
    };

    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
        res.json({});
    });

});

module.exports = router;
    

