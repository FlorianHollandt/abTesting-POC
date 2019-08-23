// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

const isLambda = require('is-lambda');
if (!isLambda) {
    require('dotenv').config();
}

module.exports = {
    logging: {
        request: true,
        requestObjects: [
            'request'
        ],
        response: true,
        responseObjects: [
            'response.outputSpeech.ssml'
        ],
    },
    intentMap: {
        'AMAZON.StopIntent': 'END',
        'AMAZON.CancelIntent': 'END',
        'AMAZON.NoIntent': 'NoIntent',
        'AMAZON.YesIntent': 'YesIntent',
        'AMAZON.HelpIntent': 'NoIntent',
    },
    custom: {
        testingVersion: process.env.TESTING_CONTENT,
        DynamoDb: {
            tableName: process.env.DYNAMODB_TABLE_NAME,
            keyAttributeName: 'id',
            keyAttributeType: 'S',
            versionAttributeName: 'version',
            versionAttributeType: 'S',
            observationAttributeName: 'isSatisfied',
            observationAttributeType: 'B',
            awsConfig: {
                accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
                secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY, 
                region:  process.env.DYNAMODB_REGION,
            },
        },
    },
};
