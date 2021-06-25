const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.110.0',
  defaultReleaseBranch: 'main',
  name: 'tryEcsEc2AutoScaling',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-autoscaling',
  ],
  gitignore: ['cdk.context.json'],
  depsUpgrade: false,
});
project.synth();