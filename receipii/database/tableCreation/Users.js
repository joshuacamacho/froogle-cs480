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
dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});