
const config = require('./config');
const AWS = require('aws-sdk');

module.exports = {

    recordObservation: function(timestamp, version, isSatisfied) {
        return new Promise(async (resolve, reject) => {
            try {
                const docClient = new AWS.DynamoDB.DocumentClient();
                const parameters = {
                    Item: {
                    id: timestamp,
                    version: version,
                    isSatisfied: isSatisfied,
                    }, 
                    // ReturnConsumedCapacity: "TOTAL", 
                    TableName : config.custom.DynamoDb.tableName,
                };
                docClient.put(
                    parameters,
                    (error, results) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(results);
                    }
                );
            } catch (e) {
                console.log(`Error: ${JSON.stringify(e, null, 4)}`);
                reject(e);
            }
        });
    },
};

