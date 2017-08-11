var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();

var params = {
	TableName: "Users",
	KeySchema: [{
		AttributeName: "Username", KeyType: "HASH",
		AttributeName: "Email", KeyType: "HASH"
	}],
	//SS stands for String Set. (List of Strings)
	//In our case, they will contain the Ids to ingredients and recipes
	AttributeDefinitions: [{
		AttributeName: "Username", AttributeType: "S",
		AttributeName: "Email", AttributeType: "S",
		AttributeName: "Password", AttributeType: "S",
		AttributeName: "Pantry", AttributeType: "SS",
		AttributeName: "Favorites", AttributeType: "SS",
	}],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5		
	}
}