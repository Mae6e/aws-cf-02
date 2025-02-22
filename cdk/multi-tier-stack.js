const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');

class MultiTierAppStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Parameters
    const vpcCidr = this.node.tryGetContext('vpcCidr') || '10.0.0.0/16';
    const subnetCidrPublic = this.node.tryGetContext('subnetCidrPublic') || '10.0.1.0/24';
    const subnetCidrPrivate = this.node.tryGetContext('subnetCidrPrivate') || '10.0.2.0/24';
    const keyName = this.node.tryGetContext('keyName');
    const imageId = this.node.tryGetContext('imageId') || 'ami-053a45fff0a704a47';
    const dbUsername = this.node.tryGetContext('dbUsername') || 'maede';
    const instanceType = this.node.tryGetContext('instanceType') || 't2.micro';
    const dbInstanceType = this.node.tryGetContext('dbInstanceType') || 'db.t3.micro';

    //? create vpc
    const vpc = new ec2.Vpc(this, 'DevVPC', {
      cidr: vpcCidr,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    //? Create Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow HTTP and SSH access',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    //? Create RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: 'Database Subnet Group',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });

    //? Create RDS Instance
    const rdsInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      securityGroups: [securityGroup],
      subnetGroup: dbSubnetGroup,
      credentials: rds.Credentials.fromUsername(dbUsername, {
        password: cdk.SecretValue.ssmSecure('/dev/rds/password', '1'), // Retrieve password from SSM
      }),
      allocatedStorage: 5,
      multiAz: false,
      publiclyAccessible: false,
    });

    //? Create EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
      instanceType: new ec2.InstanceType(instanceType),
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': imageId, // Replace with your region and AMI ID
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup,
      keyName,
    });

    //? Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: vpc.publicSubnets[0].subnetId,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: vpc.privateSubnets[0].subnetId,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
    });

    new cdk.CfnOutput(this, 'RDSInstanceEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
    });
  }
}

module.exports = { MultiTierAppStack };
