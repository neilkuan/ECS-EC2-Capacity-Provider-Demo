import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import { App, Construct, Stack, StackProps } from '@aws-cdk/core';

export interface CPDemoStackProps extends StackProps {
  isdefaultvpc?: boolean;
};

export class MyStack extends Stack {
  readonly vpc: ec2.IVpc;
  constructor(scope: Construct, id: string, props?: CPDemoStackProps) {
    super(scope, id, props);
    // this vpc do not have private subnet.
    this.vpc = props?.isdefaultvpc ? ec2.Vpc.fromLookup(this, 'defVpc', { isDefault: true }) : new ec2.Vpc(this, 'newVpc', { natGateways: 1, maxAzs: 3 });
    const vpc = this.vpc;
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      // 1 vcpu , 1GB  to demo.
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      minCapacity: 0,
      maxCapacity: 100,
      // use spot instance to saving money.
      spotPrice: '0.0136',
      desiredCapacity: 1,
    });
    const ecsC = new ecs.Cluster(this, 'tryEcsEc2AutoScalingCluster', {
      clusterName: 'Ec2AutoScalingCluster',
      vpc,
    });
    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', { autoScalingGroup });

    ecsC.addAsgCapacityProvider(capacityProvider);

    //capacityProvider.node.addDependency(ecsC.node.children.find(c=> (c as CfnResource).cfnResourceType === 'AWS::ECS::ClusterCapacityProviderAssociations') as ecs.CfnClusterCapacityProviderAssociations);
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'testNginxTD');
    taskDefinition.addContainer('testNginxC', {
      // let task desiredCount 2 need 2 nodes.
      cpu: 600,
      memoryReservationMiB: 512,
      memoryLimitMiB: 600,
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/ubuntu/nginx:latest'),
    });
    new ecs.Ec2Service(this, 'testNginx', {
      taskDefinition,
      cluster: ecsC,
      desiredCount: 1,
      // use capacity Provider Metrics to control your autoscaling group.
      capacityProviderStrategies: [
        {
          capacityProvider: capacityProvider.capacityProviderName,
          weight: 1,
        },
      ],
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'tryEcsEc2AutoScaling', { env: devEnv });

app.synth();