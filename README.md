
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/banners/abTesting_github_title.png" width="90%">

This project is a proof-of-concept (POC) for an A/B-testing architecture for Alexa Skills. There's a Medium article that the background and architecture of this POC in greater detail, whereas this repository serves more as a blueprint for how to set up the system for yourself.

Here's a graphical representation of the POC's architecture:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_architecture.png" width="90%">

This repo covers the following of these components:
- **Alexa Skill frontent** (manifest and language model)
- The **router Lambda function** (henceforth abbreviated as 'router') implemented in plain Node.js
- A deployment and testing script for the router (as bash scripts)
- The Alexa Skill backend (using the <a href="https://github.com/jovotech/jovo-framework">Jovo framework</a>) that can be deployed as the **version A and B Lambda function**
    - To keep this POC simple, the difference in their execution will come from different environment parameters
- Project and deployment information for the Alexa Skill's backend and frontend (using the <a href="https://github.com/jovotech/jovo-cli">Jovo CLI</a>)
- A setup script for the DynamoDB database that serves as the **result store**, using Node.js
- For the sake of simplicity, the Skill backend uses no other resources like DynamoDB, S3, Google Spreadsheet or other

# Setup instructions

We're going through these parts step by step. We start with the result store, then continue with the Alexa Skill frontend and backend, and finish with the router.

This script assumes that you have an AWS account, your AWS CLI and ASK CLI configured and set up, and the Jovo CLI installed. You can almost everything here 

## Setting up the result store

Setting up a simple DynamoDB table like we need for the result store is very easy, but to make it even easier I provided a setup script that you can use if you like. In order for it to access your AWS account and create the table, you'll need to paste the credentials of your AWS CLI account into the environment variables.

1. Navigate into the folder `./demoApp`, and set up your `.env` file by typing<br/>
   <code>cp .env.example .env</code>
2. If you have your AWS CLI configured and want to use these credentials for the setup script, you can open your AWS CLI credentials file by typing<br/>
   <code>cat ~/.aws/credentials</code>
3. From there, you can copy the access key ID and secret access key and paste them into the values of the parameters `AWS_CREDENTIALS_ACCESS_KEY_ID` and `AWS_CREDENTIALS_SECRET_ACCESS_KEY` of your `.env` file
4. If your want to name your DynamoDB table anything else than `ABTESTING_DATA`, your can change that in the value of the parameter `DYNAMODB_TABLE_NAME` in your `.env` file. Same with your AWS region and the parameter `AWS_REGION`.
5. If your AWS CLI user has the right IAM policies attached (you need at least `dynamodb:CreateTable`), you can now run your setup script by typing<br/>
   <code>node setup.js</code>

As a result, you should see about the following (with a list of your existing tables in the selected region above):<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_createTable.png" width="60%">

Congrats, you have already set up the results store DynamoDB. If you'd run the scipt again, it would notice that the table already exists, and not attempt to create it again.

## Setting up the A and B version of the Alexa Skill backend

To do this, you'll need two Lambda functions. Unfortunately these can't easily be created with a setup script, because they need a IAM role ARN, for which you'll need to log into the console anyways.

I assume you have a at least some familiarity with setting up Lambda functions, so I won't guide you step by step. Instead, I'm giving you the config of your Lambda, and then we'll continue afterwards.

1. Log into the AWS Console and go to the <a href="https://console.aws.amazon.com/lambda/home">Lambda function overview</a> for the region your selected before. Create a new function with the following config:
   - Name: Could be anything, by I recommend `abTesting_version_a`
   - Runtime: Node.js 8.10 or 10.x
   - Permissions: Use (or create) a role that allows `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` and `dynamodb:PutItem`
   - Increase the timeout from 3 to 5 seconds
2. Copy some of the parameters from `.env` into the 'Environment variables' section of the Lambda:
   - `DYNAMODB_TABLE_NAME` with the same value as in your local file
   - `TESTING_CONTENT` with the value `A`. **This environment variable is the only difference between versions A and B!**
3. Now copy the Lambda ARN and paste it into your `.env` file as the value of `LAMBDA_ARN_VERSION_A`
4. Repeat steps 1 to 3 for new Lambda function, except this time you're substituting `A` by `B`<br/>
    (This applies to the Lambda name, `TESTTING_CONTENT` and `LAMBDA_ARN_VERSION_B`)

Interestingly, you don't need to configure any trigger for these two Lambdas! The reason is that they are invoked by the AWS SDK, which apparently doens't count as a triggering service.

5. Now that you have set up the Lambdas for version A and B, you can deploy the demo voice app into them right away. Before, you need to install the project's dependencies:<br/>
   <code>npm run install</code>
6. To deploy to Lambda, simply type:<br/>
   <code>jovo build --stage versionA --deploy</code> and<br/>
   <code>jovo build --stage versionB --deploy</code>.<br/>

The result should look like this:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_deploy_versionA.png" width="60%">

## Setting up the router

The router is a Lambda function that manages the split of the users for the A/B-test and routes the Alexa request to the according A or B version's Lambda.

1. Go back to the <a href="https://console.aws.amazon.com/lambda/home">Lambda function overview</a> for your selected region, and create a new function with the following config:
   - Name: Could be anything, by I recommend `abTesting_router`
   - Runtime: Node.js 8.10 or 10.x
   - Permissions: Use (or create) a role that allows `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` and `lambda:InvokeFunction`
   - Increase the timeout from 3 to 8 seconds (just in case!)
   - Add 'Alexa Skills Kit' as a trigger
2. Now configure the Lambda's environment variables:
    - `LAMBDA_ARN_VERSION_A` and `LAMBDA_ARN_VERSION_B` with the respective values from your `.env` file
    - `TESTING_SPLIT` with a comma-separated list of the percentages you want for your split, e.g. `80,20` for 80% A and 20% B
    - `TESTING_SALT` with any value you can just randomly generate. If you don't feel creative, you can just take today's date in a format of your choosing.
3. Now copy the Lambda's ARN and paste it as the value of `LAMBDA_ARN_ROUTER` in the `.env` file (remember, this is still the `.env` file of the `demoApp` folder!)
4. You need a separate `.env` in the `router` folder to deploy your router, so you can either copy it or make a link (since they share some environment variables):<br/>
   <code>cp ../demoApp/.env ../router/.env</code>
5. Navigate into the `router` folder if you haven't already.
6. The last things that's missing for you to be able to deploy is the name of your AWS CLI profile, which you need to paste as the value of `AWS_PROFILE` in your `.env` variable.
7. The other last thing to do before being able to deploy is to give the deployment script execution privileges:<br/>
   <code>chmod +x deploy.sh</code><br/>
   (and <code>chmod +x invoke.sh</code>, if you also want to invoke your router from the CLI)
8. Finally, you can deploy:<br/>
   <code>./deploy.sh</code><br/>
   Optionally, you can already try and invoke your router function:<br/>
   <code>./invoke.sh</code>

The result should look like this:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_deploy_router.png" width="90%">

Something interesting to note here is that the duration was more than 2000 ms, which is definitely a lot! But given that in this case both Lambdas were cold, I think it's tolerable. If you invoke the function a couple of times, you can bring the duration down to few hundred milliseconds.

## Setting up the Alexa Skill frontend

We've waited with this until the end because we need to have an endpoint ARN that is configured to accept triggers from the Alexa Skills Kit, which we just set up in the previous step.

Now this will be the easiest to set up:

1. Navigate back into the `demoApp` folder, and now build and deploy the language model and Skill manifest:<br/>
   <code>jovo build --stage console --deploy</code>

The result should look like this:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_deploy_alexaSkill.png" width="60%">

2. Now copy the Skill ID and paste it as the value of `SKILL_ID` in your `.env` file for future reference.

**Congrats, you have completely set up this A/B-testing POC!**

# Seeing it in action!

Now let's trs it out. Please don't expect something spectacular, it's just a POC. But I hope it makes it easy to imagine more interesting use cases for it!

Here's the dialog you can expect when you invoke the Skill:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_dialog.png" width="40%">

If you invoke it a couple of times, you should get a mix of A and B, depending on the split ration you configured for the router. This behavior wouldn't make sense for a live application, where one user should consistently see the same version - And that's how the router is actually built. Just for demonstration purposes (i.e. to populate the result store with interesting data), this POC assigns a version depending on the session ID instead of the user ID. You can change this behavior by uncommenting line 20 of the router's `index.js` file.

Now let's look inside the result store DynamoDB:<br/>
<img src="https://dicechampionship.s3-eu-west-1.amazonaws.com/screenshots/abTesting_results.png" width="50%">

For a real-world application, you would define your custom metrics here, and could then do inferential statistics with these data.

# Conclusion

If you followed along, you should have gotten a functional POC for A/B-testing an Alexa Skill. If you ran into any issues during setup, please let me know!

I personally see a huge potential for optimizing voice apps with A/B-testing, and hope that you can adapt this POC for your specific purposes. It's worth noting that while the Jovo framework and CLI are great for development and deployment, this system works just as well with any other framework or SDK that runs on Lambda.

Thanks for reading. If this has been useful to you, please give this repo a star and/or <a href="https://twitter.com/FlorianHollandt">follow me on Twitter</a>.