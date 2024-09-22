import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { SienaAiStack } from '../lib/siena-ai-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack, {});

  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'siena-ai-csv-bucket',
  });
});

test('SNS Topic Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SNS::Topic', {
    DisplayName: 'CSV Uploaded Topic',
  });
});

test('DynamoDB Tables Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    KeySchema: [
      {
        AttributeName: 'intent',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'channel',
        KeyType: 'RANGE',
      },
    ],
  });

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
  });
});

test('CsvUploader Lambda Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 30,
    Environment: {
      Variables: {
        BUCKET_NAME: {},
        SNS_TOPIC_ARN: {},
      },
    },
  });
});

test('Classifier Lambda Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 30,
    Environment: {
      Variables: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        BUCKET_NAME: {},
        INTENTS_TABLE: {},
        MESSAGES_TABLE: {},
      },
    },
  });
});

test('Conversations Lambda Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 30,
    Environment: {
      Variables: {
        INTENTS_TABLE: {},
        MESSAGES_TABLE: {},
      },
    },
  });
});

test('Messages Lambda Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 30,
    Environment: {
      Variables: {
        MESSAGES_TABLE: {},
      },
    },
  });
});

test('API Gateway Created', () => {
  const app = new cdk.App();
  const stack = new SienaAiStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'csvUploadApi',
  });

  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: 'csv-uploader',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'POST',
  });

  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: 'conversation',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'GET',
  });

  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: '{id}',
  });

  template.hasResourceProperties('AWS::ApiGateway::Resource', {
    PathPart: 'message',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'GET',
  });
});
