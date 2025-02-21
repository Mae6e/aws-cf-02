const AWS = require('@aws-sdk/client-cloudformation');
const fs = require('fs');

const keyPair = process.env.KEY_PAIR_NAME;
const StackName = process.env.STACK_NAME;
const region = process.env.REGION;

const cloudformation = new AWS.CloudFormation({ region });

const params = {
  StackName,
  TemplateBody: fs.readFileSync('cloud-formation/multi-tier-stack.yml', 'utf8'),
  Parameters: [{ ParameterKey: 'KeyName', ParameterValue: keyPair }],
};

cloudformation.createStack(params, (error, data) => {
  if (error) console.error('Error:', error.message);
  else console.log('Stack creation started:', data.StackId);
});
