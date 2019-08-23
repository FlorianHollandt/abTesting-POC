
const _get = require('lodash.get');
const aws = require('aws-sdk');
const murmurhash = require('murmurhash');

exports.handler = async (event, context) => {

    /*
        This following ID should be unique per user across sessions,
        which is done using a Murmurhash, a 32-bit non-crypotgraphic
        hash function.
        The concatenation with 'TESTING_SALT' serves to make the system
        re-usable for consecutive tests.
        For the purpose of this demo Skill, the session ID is used,
        which makes the demo and the generated results more interesting.
    */
    const testSubjectId = _get(
        event,
        'session.sessionId'
        // 'session.user.userId'
    ) || new Date().toISOString();
    console.log(`Test subject ID: ${testSubjectId}`);
    const hash = murmurhash.v3(
        `${testSubjectId}${process.env.TESTING_SALT}`
    );

    /*
        The number of versions isn't explicitly configured, but infered from the
        number of ARNs of Lambda endpoints
    */
    const versions = Object.keys(process.env).filter(
        (propertyName) => {
            return propertyName.match('LAMBDA_ARN_VERSION_');
        }
    ).map(
        (propertyName) => {
            return propertyName.match(/LAMBDA_ARN_VERSION_(\w+)/)[1]
        }
    );

    /*
        The following 30 lines are for defining which range
        of the hash is assigned to which version. 
    */
    const singleFractions = process.env.TESTING_SPLIT
        .replace(/\s/g, '')
        .split(',')
        .map(
        (item) => {
            return parseInt(item)/100
        }
    );
    let aggregatedFractions = [];
    if (singleFractions[0]) {
        aggregatedFractions.push(
            singleFractions[0]
        );
        for (let i = 1; i < versions.length; i++) {
            if (singleFractions[i]) {
                aggregatedFractions.push(
                    aggregatedFractions[i - 1] + singleFractions[i]
                );
            } else {
                aggregatedFractions.push(1);
            }
        }
    } else {
        /* Fallback for the case that the parameter 'VERSION_SPLIT' has no valid value */
        for (let i = 0; i < versions.length; i++) {
            aggregatedFractions.push(
                (i + 1) / versions.length
            );
        }
    }

    /*
        Finally, we determine to which fraction the hash value belongs.
        (We divide the hash by 2^32 because it's a 32-bit hash.)
    */
    const index = aggregatedFractions.findIndex(
        (item) => {
            return item > (hash / Math.pow(2, 32))
        }
    );
    /* 
        For the simplest case of an even distribution between splits,
        the following line can be used instead of everything above w/ fractions
    */
    // const index = hash % versions.length;

    const versionName = `LAMBDA_ARN_VERSION_${versions[index]}`
    const versionArn = process.env[versionName];
    console.log(`Selected version name: ${versionName}`);
    console.log(`Selected version ARN: ${versionArn}`);

    /*
        Invoke the Lambda function of the selected version
    */
    const lambda = new aws.Lambda();
    let response = null;
    try {
        response = await invokeLambda(
            lambda,
            versionArn,
            event
        );
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error, null, 4)}`);
    }
    
    /*
        Pass the result from the selected version's Lambda on to Alexa
    */
    return JSON.parse(response, null, 4);
};

function invokeLambda(lambda, arn, payload) {
    return new Promise(
        (resolve, reject) => {
            lambda.invoke(
                {
                    FunctionName: arn,
                    Payload: JSON.stringify(payload)
                },
                (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    if (data.Payload) {
                        resolve(data.Payload)
                    }
                }
            );
        }
    )
}