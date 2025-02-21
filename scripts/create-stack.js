const AWS = require('@aws-sdk/client-cloudformation');
const fs = require('fs');

const keyPair = process.env.KEY_PAIR_NAME;
const region = process.env.REGION;

const stack = process.argv.slice(2)[0];

const cloudformation = new AWS.CloudFormation({ region });

const params = {
  StackName: stack,
  TemplateBody: fs.readFileSync(`cloud-formation/${stack}.yml`, 'utf8'),
  Parameters: [{ ParameterKey: 'KeyName', ParameterValue: keyPair }],
};

cloudformation.createStack(params, (error, data) => {
  if (error) console.error(`Stack ${stack} creation Error:`, error.message);
  else console.log(`Stack ${stack} creation started:`, data.StackId);
});
