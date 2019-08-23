#!/bin/bash

# Reading .env file
set -o allexport
source ./.env
set +o allexport

# Define loading animation
load()
{
  loadingBar=" [ "
  while :
  do
    loadingBar="$loadingBar#"
    echo -ne "$loadingBar\r"
    sleep 1
  done
}

# Zipping directory
echo 'Zipping directory...'
load &
LOAD_PID=$!
zip -r Archive.zip node_modules index.js -q
kill -13 $LOAD_PID &>/dev/null
echo 'Directory zipped! :)'

# Uploading to Lambda
echo 'Uploading to AWS Lambda...'
load &
LOAD_PID=$!
aws lambda update-function-code \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --function-name $LAMBDA_ARN_ROUTER \
    --zip-file fileb://./Archive.zip \
    | grep LastModified \
    | cut -f 4 -d '"' \
    | awk '{print "Lambda successfully updated at "$1" :)"}'
kill -13 $LOAD_PID &>/dev/null

# Clean up
rm Archive.zip
