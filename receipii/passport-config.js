var passport = require('passport');
var LocalStrategy = require('passport-local');
var sha256 = require('sha256');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient();


passport.serializeUser(function(user, done) {
    done(null, user.Item);
});

passport.deserializeUser(function(login, done) {
    //return the user object to callback done
    var user = login.Email;
    var params = {
        TableName: "Users",
        Key:{
            "Email": user
        }
    };

    //return user by login
    docClient.get(params, function(err, item, cap) {
        done(err, item);
    });
});

passport.use(new LocalStrategy(
    function(user, pass, done) {
        //return user by login
        var params = {
            TableName: "Users",
            Key:{
                "Email": user
            }
        };


        docClient.get(params, function(err, item, cap) {

            if (err) {
                //return the response from callback when an error happen
                return done(err);
            } else {
                if (item && sha256(pass) === item.Item.password) {
                   //return the response from callback when the login is ok
                    console.log("Valid user");
                    return done(null, item);

                } else {
                    //return the response from callback when the login is invalid
                    console.log("Incorrect auth");
                    return done(null, false, {
                        message: 'Login Invalid'
                    })
                }
            }
        });

 }));

module.exports = passport;