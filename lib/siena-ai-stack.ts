import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

import { Construct } from 'constructs';
import * as path from 'path';

/**
 * The `SienaAiStack` class defines an AWS CDK stack for the Siena AI application.
 * This stack includes the following resources:
 * 
 * - An S3 bucket for storing CSV files.
 * - An SNS topic for notifying when a CSV file is uploaded.
 * - DynamoDB tables for storing intents and messages.
 * - Lambda functions for handling CSV uploads, classifying intents, managing conversations, and handling messages.
 * - An API Gateway for exposing the Lambda functions as HTTP endpoints.
 * 
 * Resources:
 * - `csvBucket`: An S3 bucket named 'siena-ai-csv-bucket' with a removal policy of DESTROY.
 * - `csvUploadedTopic`: An SNS topic with the display name 'CSV Uploaded Topic'.
 * - `intentsTable`: A DynamoDB table named 'IntentsTable' with 'intent' as the partition key and 'channel' as the sort key.
 * - `messagesTable`: A DynamoDB table named 'MessagesTable' with 'id' as the partition key.
 * - `csvUploader`: A Lambda function for handling CSV uploads, with environment variables for the bucket name and SNS topic ARN.
 * - `classifier`: A Lambda function for classifying intents, with environment variables for the OpenAI API key, bucket name, and DynamoDB table names.
 * - `conversations`: A Lambda function for managing conversations, with environment variables for the DynamoDB table names.
 * - `messages`: A Lambda function for handling messages, with an environment variable for the messages table name.
 * - `api`: An API Gateway for exposing the Lambda functions as HTTP endpoints.
 * 
 * Permissions:
 * - The `csvUploader` Lambda function has permissions to put objects in the S3 bucket and publish messages to the SNS topic.
 * - The `classifier` Lambda function has permissions to read from the S3 bucket and read/write to the DynamoDB tables.
 * - The `conversations` Lambda function has permissions to read/write to the DynamoDB tables.
 * - The `messages` Lambda function has permissions to read/write to the messages table.
 * 
 * API Endpoints:
 * - `POST /csv-uploader`: Endpoint for uploading CSV files.
 * - `GET /conversation`: Endpoint for retrieving conversations.
 * - `GET /conversation/{id}/message`: Endpoint for retrieving messages by conversation ID.
 * 
 * @class
 * @extends cdk.Stack
 */
export class SienaAiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 resource
    const csvBucket = new s3.Bucket(this, 'csvBucket', {
      bucketName: 'siena-ai-csv-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic
    const csvUploadedTopic = new sns.Topic(this, 'csvUploadedTopic', {
      displayName: 'CSV Uploaded Topic',
    });

    // DynamoDB Tables
    const intentsTable = new dynamodb.Table(this, 'IntentsTable', {
      tableName: 'IntentsTable',
      partitionKey: {
        name: 'intent',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'channel',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'MessagesTable',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambdas
    const csvUploader = new NodejsFunction(this, 'CsvUploader', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      functionName: 'CsvUploader',
      entry: path.join(__dirname, '../services/assets/csv-uploader/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: csvBucket.bucketName,
        SNS_TOPIC_ARN: csvUploadedTopic.topicArn,
      },
    });

    // Grant S3 put permissions to the lambda
    csvBucket.grantPut(csvUploader);

    // Grant SNS publish permissions to the lambda
    csvUploadedTopic.grantPublish(csvUploader);

    const classifier = new NodejsFunction(this, 'Classifier', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      functionName: 'Classifier',
      entry: path.join(__dirname, '../services/classifier/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        BUCKET_NAME: csvBucket.bucketName,
        INTENTS_TABLE: intentsTable.tableName,
        MESSAGES_TABLE: messagesTable.tableName,
      },
    });

    // SNS subscription for the intent classifier
    csvUploadedTopic.addSubscription(new subs.LambdaSubscription(classifier));

    // Grant S3 read permissions to the lambda
    csvBucket.grantRead(classifier);

    // Grant DynamoDB read/write permissions to the lambda
    classifier.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchWriteItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [intentsTable.tableArn, messagesTable.tableArn],
      })
    );

    const conversations = new NodejsFunction(this, 'Conversations', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      functionName: 'Conversations',
      entry: path.join(__dirname, '../services/conversations/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        INTENTS_TABLE: intentsTable.tableName,
        MESSAGES_TABLE: messagesTable.tableName,
      },
    });

    // Grant DynamoDB read/write permissions to the lambda
    conversations.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchWriteItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [intentsTable.tableArn, messagesTable.tableArn],
      })
    );

    const messages = new NodejsFunction(this, 'Messages', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      functionName: 'Messages',
      entry: path.join(__dirname, '../services/messages/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        MESSAGES_TABLE: messagesTable.tableName,
      },
    });

    // Grant DynamoDB read/write permissions to the lambda
    messages.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchWriteItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [messagesTable.tableArn],
      })
    );

    // API resource
    const api = new apigateway.LambdaRestApi(this, 'csvUploadApi', {
      handler: csvUploader,
      proxy: false,
    });

    // Api Methods
    const uploadResource = api.root.addResource('csv-uploader');
    uploadResource.addMethod('POST');

    const conversationsResource = api.root.addResource('conversation');
    conversationsResource.addMethod('GET', new apigateway.LambdaIntegration(conversations));

    const conversationByIdResource = conversationsResource.addResource('{id}');

    const messagesResource = conversationByIdResource.addResource('message');
    messagesResource.addMethod('GET', new apigateway.LambdaIntegration(messages));
  }
}
