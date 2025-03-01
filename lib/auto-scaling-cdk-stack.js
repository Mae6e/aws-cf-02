const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');

class AutoScalingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //? Parameters
    const keyName = new cdk.CfnParameter(this, 'KeyName', {
      type: 'AWS::EC2::KeyPair::KeyName',
      default: 'dev-key',
    });

    // const imageId = new cdk.CfnParameter(this, 'ImageId', {
    //   type: 'String',
    //   default: 'ami-053a45fff0a704a47',
    //   description: 'AMI ID for the EC2 instance',
    // });

    const instanceType = new cdk.CfnParameter(this, 'InstanceType', {
      type: 'String',
      default: 't2.micro',
    });

    const vpcId = new cdk.CfnParameter(this, 'VpcId', {
      type: 'String',
      default: 'vpc-0977d6e274954f035',
      description: 'VPC ID for the EC2 instance',
    });

    // const securityGroupId = new cdk.CfnParameter(this, 'SecurityGroupId', {
    //   type: 'String',
    //   description: 'Security Group ID to use for the EC2 instances',
    //   default: 'sg-066700fcd982d04c6',
    // });

    const subnetIda = new cdk.CfnParameter(this, 'SubnetIda', {
      type: 'String',
      default: 'subnet-01b5de9df3e60a25e',
      description: 'Subnet ID for the EC2 instance',
    });

    const subnetIdf = new cdk.CfnParameter(this, 'SubnetIdf', {
      type: 'String',
      default: 'subnet-0bcdd7aed28290bce',
      description: 'Subnet ID for the EC2 instance',
    });

    //? Resources
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
      vpcId: vpcId.valueAsString,
      availabilityZones: cdk.Stack.of(this).availabilityZones.sort().slice(0, 1),
      publicSubnetIds: [subnetIda.valueAsString, subnetIdf.valueAsString],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow HTTP and SSH access',
      allowAllOutbound: true, // Allow all outbound traffic
      securityGroupName: 'dev-security-group', // Optional: Name for the security group
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup,
      loadBalancerName: 'dev-alb',
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        path: '/',
        port: '80',
        protocol: elbv2.Protocol.HTTP,
      },
    });

    loadBalancer.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', keyName.valueAsString);

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: 'dev-template',
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: new ec2.InstanceType(instanceType.valueAsString),
      securityGroup,
      keyPair,
      userData: ec2.UserData.custom(`
        dnf update -y
        dnf install -y nginx
        systemctl enable nginx
        systemctl start nginx
        echo "<h1>Hello from Auto Scaling EC2!</h1>" > /usr/share/nginx/html/index.html
      `),
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetFilters: [
          ec2.SubnetFilter.availabilityZones(['us-east-1a']), // set AZ here
        ],
      },
      // vpcSubnets: {
      //   subnetType: ec2.SubnetType.PUBLIC,
      // },
      launchTemplate,
    });

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
  }
}

module.exports = { AutoScalingStack };
