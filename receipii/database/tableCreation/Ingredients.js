var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();

var params = {
	TableName: "Ingredients",
	KeySchema: [{
		AttributeName: "Name", KeyType: "HASH",
		AttributeName: "Type", KeyType: "HASH"
	}],
	AttributeDefinitions: [{
		AttributeName: "Name", AttributeType: "S",
		AttributeName: "Type", AttributeType: "S",
	}],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5		
	}
}