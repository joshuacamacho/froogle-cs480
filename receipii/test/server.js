var expect  = require("chai").expect;
var request = require("request");

describe("Recipii Pages", function() {

    describe("Home Page", function () {
        var url = "http://localhost";
        it("returns status 200", function (done) {
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    describe("Pantry Page", function () {

        it("returns status 401 when not logged in", function (done) {
            request("http://localhost/pantry", function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });

    describe("Submit Recipe Page", function () {

        it("returns status 401 when not logged in", function (done) {
            request("http://localhost/submit", function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });
});

describe("Get Recipe API", function() {
    it("returns correct recipe when given a recipe name", function(done) {
        request.get("http://localhost/recipe?name=Toast", function(error, response, body) {
            expect(JSON.parse(body).Recipe).to.equal("Toast");
            done();
        });
    });

    it("returns status 400 when recipe name or amount not given", function(done) {
        request.get("http://localhost/recipe", function(error, response, body) {
            expect(response.statusCode).to.equal(400);
            done();
        });
    });

    it("returns specific amount of recipes when given amount", function(done) {
        request.get("http://localhost/recipe?amount=10", function(error, response, body) {
            // JSON.parse(body);
            expect(JSON.parse(body).length).to.equal(10);
            done();
        });
    });

});

describe("Recipe Search API", function () {

    it("Returns 50 recipes when search terms are not present", function (done) {
        request.get("http://localhost/recipeSearch", function (error, response, body) {
            expect(JSON.parse(body).hits.length).to.equal(50);
            done();
        });
    });

});