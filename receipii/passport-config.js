var passport = require('passport');
var LocalStrategy = require('passport-local');
var sha256 = require('sha256');
var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();

passport.use(new LocalStrategy(
    function(user, pass, done) {
        //return user by login
        docClient.getItem('Users', user, null, {}, function(err, item, cap) {

            if (err) {
                //return the response from callback when an error happen
                return done(err);
            } else {
                if (item && sha256(pass) === item.hash) {
                   //return the response from callback when the login is ok
                    return done(null, item);

                } else {
                    //return the response from callback when the login is invalid
                    return done(null, false, {
                        message: 'Login Invalid'
                    })
                }
            }
        });

 }));

module.exports = passport;