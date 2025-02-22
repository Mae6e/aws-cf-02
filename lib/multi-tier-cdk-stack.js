const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

class MultiTierAppStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //? Parameters
    const vpcCidr = '10.0.0.0/16';

    //? Create VPC
    const vpc = new ec2.Vpc(this, 'DevVPC', {
      cidr: vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      maxAzs: 2,
    });

    //? Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }
}

module.exports = { MultiTierAppStack };
