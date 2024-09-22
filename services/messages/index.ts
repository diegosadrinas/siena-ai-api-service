/**
 * AWS Lambda handler to retrieve a message from DynamoDB based on the provided event.
 *
 * @param event - The event object containing the path parameters and other request details.
 * @returns A promise that resolves to an HTTP response object.
 *
 * The function performs the following steps:
 * 1. Logs the incoming event.
 * 2. Constructs the parameters for the DynamoDB `get` operation using the `MESSAGES_TABLE` environment variable and the `id` from the event's path parameters.
 * 3. Attempts to retrieve the item from the DynamoDB table.
 * 4. If the item is not found, returns a 404 response with an error message.
 * 5. If the item is found, constructs a conversation object containing the message and response.
 * 6. Returns a 200 response with the conversation object.
 * 7. If an error occurs during the DynamoDB operation, logs the error and returns a 500 response with the error message.
 */
import { DynamoDB } from 'aws-sdk';
import { log } from 'console';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiResponse } from '../utils';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<ApiResponse> => {
  log("event", JSON.stringify(event, null, 2));

  const params = {
    TableName: process.env.MESSAGES_TABLE!,
    Key: {
      id: event?.pathParameters?.id,
    },
  };

  try {
    // Get item from messages table
    const { Item } = await dynamoDb.get(params).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Item not found' }),
      };
    }

    // Build the conversation object
    const conversation = {
      message: Item.message,
      response: Item.response,
    }

    return {
      statusCode: 200,
      body: JSON.stringify(conversation),
    };
  } catch (error) {
    console.error('DynamoDB Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
