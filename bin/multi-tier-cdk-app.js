const cdk = require('aws-cdk-lib');
const { MultiTierAppStack } = require('../lib/multi-tier-cdk-stack');

const app = new cdk.App();
new MultiTierAppStack(app, 'MultiTierCdkApp');
