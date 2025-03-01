const cdk = require('aws-cdk-lib');
const { AutoScalingStack } = require('../lib/auto-scaling-cdk-stack');

const app = new cdk.App();
new AutoScalingStack(app, 'AutoScalingStack');
