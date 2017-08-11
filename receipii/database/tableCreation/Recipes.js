var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();

var params = {
	TableName: "Recipes",
	KeySchema: [{
		AttributeName: "Recipe", KeyType: "HASH"
	}],
	AttributeDefinitions: [{
		AttributeName: "Recipe", AttributeType: "S",
		AttributeName: "Author", AttributeType: "S",
		AttributeName: "Type", AttributeType: "S",
		AttributeName: "Ingredients", AttributeType: "SS",
		AttributeName; "Directions", AttributeType: "SS",
		AttributeName: "Rating", AttributeType: "N",
		AttributeName: "Recipe", AttributeType: "S",
	}],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5		
	}
}
dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});