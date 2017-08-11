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
dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});