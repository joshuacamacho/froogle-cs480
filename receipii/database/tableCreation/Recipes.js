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