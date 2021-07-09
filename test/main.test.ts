import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { MyStack } from '../src/main';

test('Testing', () => {
  const app = new App();
  const stack = new MyStack(app, 'test', { isdefaultvpc: false });
  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::ECS::ClusterCapacityProviderAssociations');
  expect(stack).toHaveResource('AWS::ECS::CapacityProvider');
});