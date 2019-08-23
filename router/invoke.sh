#!/bin/bash

# Reading .env file
set -o allexport
source ./.env
set +o allexport

# Define loading animation
load()
{
  spinner=" [ "
  while :
  do
    loadingBar="$loadingBar#"
    echo -ne "$loadingBar\r"
    sleep 1
  done
}

# Invoke Lambda
echo 'Invoking Lambda function with test event...'
load &
LOAD_PID=$!
aws lambda invoke \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --function-name $LAMBDA_ARN_ROUTER \
    --invocation-type RequestResponse \
    --log-type Tail \
    --qualifier "\$LATEST" \
    --payload "`cat LaunchRequest.json`" \
    './result.json' > temp.json
kill -13 $LOAD_PID &>/dev/null
cat temp.json \
    | grep StatusCode \
    | cut -f 2 -d ':' \
    | awk '{print "Lambda function invoked with status code "$1" :)"}'
cat temp.json \
    | grep LogResult \
    | cut -f 4 -d '"' \
    | base64 --decode
cat result.json | python -mjson.tool

# Clean up
rm temp.json
rm result.json