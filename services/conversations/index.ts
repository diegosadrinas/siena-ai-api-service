/**
 * AWS Lambda handler for retrieving conversations from a DynamoDB table.
 * 
 * @param event - The event object containing request parameters.
 * @returns A promise that resolves to an HTTP response object.
 * 
 * The handler performs the following steps:
 * 1. Logs the incoming event.
 * 2. Constructs the parameters for the DynamoDB scan operation, including:
 *    - TableName: The name of the DynamoDB table (from environment variable).
 *    - ProjectionExpression: The attributes to be retrieved.
 *    - Limit: The maximum number of items to retrieve (default is 10).
 *    - ExclusiveStartKey: The key to start the scan from (if provided).
 * 3. Executes the scan operation on the DynamoDB table.
 * 4. Returns a successful HTTP response with the retrieved conversations and the last evaluated key.
 * 5. Handles any errors by logging them and returning an HTTP 500 response with the error message.
 */
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { log } from "console";
import { ApiResponse } from "../utils";

const dynamoDb = new DynamoDB.DocumentClient();
const tableName = process.env.MESSAGES_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<ApiResponse> => {
  log("event", JSON.stringify(event, null, 2));
  const params = {
    TableName: tableName,
    ProjectionExpression: "id, sender_username, receiver_username, message, channel",
    Limit: event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit, 10) : 10,
    ExclusiveStartKey: event.queryStringParameters?.startKey ? JSON.parse(event.queryStringParameters?.startKey) : null,
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        conversations: data.Items,
        lastEvaluatedKey: data.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error("DynamoDB Error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

