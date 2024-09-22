# Siena AI Application

This project is an AWS Cloud Development Kit (CDK) application written in TypeScript. It deploys an RestAPI service to ingest data and deploys several AWS Lambda functions that consumes OpenAI api service:
  * CSV Uploader: The CSV Uploader is a service within the Siena AI application that allows users to upload CSV files. The uploaded CSV files are processed by an AWS Lambda function, which extracts the data and stores it in DynamoDB. This service enables efficient ingestion and storage of large datasets, facilitating further processing and analysis.
  * Classifier: 

## Table of Contents

- [Description](#description)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Cleanup](#cleanup)
- [Additional Resources](#additional-resources)
- [License](#license)

## Description

The Siena AI application is designed to handle and process messages and intents using AWS Lambda and DynamoDB. The application consists of a Lambda function that performs CRUD operations on DynamoDB tables.

## Architecture

The application architecture includes the following components:
- **AWS Lambda**: A serverless compute service that runs the backend logic.
- **Amazon DynamoDB**: A NoSQL database service used to store messages and intents.
- **AWS CDK**: An open-source software development framework to define cloud infrastructure in code.

## Prerequisites

Before you begin, ensure you have the following:
- Node.js (>= 18.x)
- AWS CLI configured with your AWS account
- AWS CDK Toolkit installed globally (`npm install -g aws-cdk`)

## Setup Instructions

1. **Clone the Repository**:
   ```sh
   git clone <repository-url>
   cd <repository-directory>

2. **Install Dependencies**:
    ```sh
    npm install
    ```

3. **Bootstrap the CDK Environment**:
    ```sh
    cdk bootstrap
    ```


## Usage
### Building the project
Compile the TypeScript code to JavaScript:
    ```sh
    npm run build
    ```

### Synthesizing the CloudFormation Template
Generate the CloudFormation template without deploying:
  ```sh
  cdk synth
  ```

## Testing
Run unit tests using Jest:
  ```sh
  npm test
  ```
*Testing has been set to check the infrastructure before deployment. No unit tests have been configured for each service with mock data

## Deployment
To deploy the application, use the following command:
  ```sh
  cdk deploy
  ```

## Populate the Intents DynamoDB table with generic responses for each intent:
  ```sh
  ts-node populateIntentsTable.ts
  ```

## Cleanup
To remove the deployed resources, use the following command:
  ```sh
  cdk destroy
  ```

## API Collection
For a complete showcase on the requests explained above, see the Postman Collection, available at: [Postman Siena AI Collection](https://www.postman.com/dsadrinas/public-workspaces/collection/kjurm8j/siena-challenge)


1. **CSV Uploader (POST)**:
The CSV Uploader endpoint allows users to upload CSV files, which are then processed and stored in an S3 Bucket.
    #### Headers
    - `Content-Type: text/csv`

    #### Body
    - `file`: The CSV file to be uploaded.

2. **Conversation Endpoint (GET)**:
The Conversation endpoint allows users to retrieve stored conversations from DynamoDB. It supports pagination using `limit` and `startKey` parameters.
    #### Headers
    - `Content-Type: application/json`

    #### Query Parameters
    - `limit` (optional): The maximum number of conversations to retrieve.
    - `startKey` (optional): The key to start pagination from.

3. **Message Endpoint (GET)**:
The Messages endpoint allows users to retrieve all messages within a specific conversation stored in DynamoDB. It requires a conversation ID as a path parameter.
    #### Headers
    - `Content-Type: application/json`

    #### Path Parameters
    - `id`: The ID of the conversation to retrieve messages from.


## OpenAI Mock Data for testing requests
Since OPENAI does not allow to perform actual requests on its free tier, I have created the following responses based on the data provided from ChatGPT. This allows you to test the existing handlers with what would be the most accurate mock data available, since it is provided by chatGPT itself and is coherent with openai documentation.

  ### Classify Intent Response:
    ```javascript
      {
        id: 'cmpl-6lFZK7Tp47B5F1LkHsfXYZ12345',
        object: 'text_completion',
        created: 1694779200,
        model: 'text-davinci-003',
        choices: [
          {
            text: '\nRequest for product availability\nRequest for veteran discount',
            index: 0,
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 83,
          completion_tokens: 10,
          total_tokens: 93,
        }
      };
    ```

    - Prompt: https://drive.google.com/file/d/1lYPGx9s0CnmtJU3DRoTCSk0NCKCdrB8o/view?usp=drive_link
    - Response: https://drive.google.com/file/d/1hDLrzdXmhPIyzTHcLllFSmfKEbBxPvlr/view?usp=drive_link
    - For multiple intents: https://drive.google.com/file/d/16xcSf54KVWqj8AH2Mon5VnQkSoPtqEso/view?usp=sharing
    - Multiple Intents Response: https://drive.google.com/file/d/1JANQT6Un38GZq8J4DcAyqvychoqVVqzh/view?usp=drive_link


  ### Validate Intent Response:
    ```javascript
    {
      id: 'cmpl-6lGxZyTp47B6V1LkHsfXYZ12345',
      object: 'text_completion',
      created: 1694780000,
      model: 'text-davinci-003',
      choices: [
        {
          text: "Yes. The predicted intents 'Request for product availability' and 'Request for veteran discount' match the message, as the customer is inquiring about both the availability of the product and whether there is a veteran discount.",
          index: 0,
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 120,
        completion_tokens: 40,
        total_tokens: 160,
      },
    };
    ```

  - Prompt: https://drive.google.com/file/d/1tXtF97FAeE6Ro8gqspHMR4ByRfF5lbZ1/view?usp=drive_link
  - Response: https://drive.google.com/file/d/1XB5hgAZYYNx6v5-1U-DQILEOr371dHey/view?usp=drive_link



  ### Enhance Response: 
    ```javascript
    {
      id: 'cmpl-6lJYV1Tp48F5G9PfHsfXYZ12345',
      object: 'text_completion',
      created: 1694781200,
      model: 'text-davinci-003',
      choices: [
        {
          text: "Dear {{sender_username}}, thank you for your interest! I'm pleased to let you know that the product is currently available, and as a token of our gratitude for your service, we're happy to offer a 10% discount to veterans. Please don't hesitate to reach out if you have any further questions!",
          index: 0,
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 48,
        total_tokens: 148,
      },
    };
    ```

  - Prompt & Response: https://drive.google.com/file/d/1MZw5fMmCoYVVXl8HJC84sYcD4f-kv2iC/view?usp=drive_link







  






