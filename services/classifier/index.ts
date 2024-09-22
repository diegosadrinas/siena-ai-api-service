/**
 * AWS Lambda handler for processing SNS events containing S3 bucket information.
 *
 * This function performs the following steps:
 * 1. Logs the incoming event.
 * 2. Extracts the S3 bucket name and key from the SNS message.
 * 3. Retrieves the CSV file from the specified S3 bucket.
 * 4. Parses the CSV data.
 * 5. Processes the first 10 rows of the CSV data:
 *    - Classifies the intent of the message.
 *    - Validates the classified intent.
 *    - Generates a response based on predefined templates.
 *    - Enhances the response.
 *    - Stores the response in DynamoDB.
 * 6. Returns a status code and any errors encountered during processing.
 *
 * @param event - The SNS event containing S3 bucket information.
 * @returns An object containing the status code and any errors encountered.
 */
import { SNSEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { log } from 'console';

import { ApiResponse, parseCSV } from '../utils';
import { classifyIntent, enhanceResponse, getPredefinedResponse, storeResponse, validateIntent } from './utils';

const s3 = new S3();

export const handler = async (event: SNSEvent): Promise<ApiResponse> => {
  log('event', JSON.stringify(event, null, 2));
  const { Message } = event.Records[0].Sns;
  const { bucketName, bucketKey } = JSON.parse(Message);

  const params = {
    Bucket: bucketName,
    Key: bucketKey,
  };

  // Get s3 stream
  const s3Stream = s3.getObject(params).createReadStream();

  // Parse the csv data
  const data = await parseCSV(s3Stream);

  const errors = [];
  for (const row of data) {
    try {
      const { sender_username: sender, receiver_username: receiver, channel, message } = row;

      // Classify intent
      const predictedIntents = await classifyIntent(message);

      // Validate intent
      const isValidIntent = await validateIntent(message, predictedIntents);

      if (isValidIntent && predictedIntents.length > 0) {
        const response = [];
        for (const intent of predictedIntents) {
          const template = await getPredefinedResponse(intent, channel);

          response.push(template.replace('{{senderUsername}}', sender).replace('{{receiverUsername}}', receiver));
        }
        const enhancedResponse = await enhanceResponse(response.join('\n'), sender);

        // Store response in DynamoDb
        await storeResponse({
          response: enhancedResponse,
          sender,
          receiver,
          message,
          intents: predictedIntents,
          channel,
        });
      }
    } catch (error) {
      errors.push(error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processed messages', errors }),
  };
};
