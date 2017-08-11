var request = require("request")
//Definitely shouldnt keep keys here in the future.
var appID = "b68cf5a6"
var appKey = "5745a8dc124818a320beeeec66376762"
var ourData = ""

var baseurl = "http://api.yummly.com/v1/api/recipes?_app_id=" + appID + "&_app_key="+ appKey
//test request.

request({
    url: baseurl,
    json: true
}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
        ourData = body; // Print the json response
    }
})