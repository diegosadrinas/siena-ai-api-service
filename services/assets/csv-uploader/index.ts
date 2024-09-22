/**
 * Handler function for processing CSV uploads.
 *
 * This function performs the following steps:
 * 1. Validates the file type to ensure it is a CSV.
 * 2. Parses the CSV content and validates the number of records.
 * 3. Validates the headers of the CSV.
 * 4. Validates the channel values in each record.
 * 5. Uploads the CSV to an S3 bucket.
 * 6. Publishes a message to an SNS topic to notify the next service.
 *
 * @param event - The event object containing the CSV file data and metadata.
 * @returns An object with a status code and a message indicating the result of the operation.
 *
 * @throws Will return a 400 status code if the file type is invalid, the CSV does not contain exactly 1000 records,
 *         the CSV contains invalid headers, or if there are invalid channel values in the records.
 *         Will return a 500 status code if there is an error processing the CSV.
 */
import { APIGatewayProxyEvent } from 'aws-lambda';
import { S3, SNS } from 'aws-sdk';
import { log } from 'console';
import { v4 as uuid } from 'uuid';

import { ApiResponse, parseCSV } from '../../utils';

export type AllowedChannels = 'instagram' | 'facebook' | 'whatsapp' | 'email';
export type CSVRecord = {
  sender_username: string;
  receiver_username: string;
  channel: AllowedChannels;
  message: string;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<ApiResponse> => {
  log('event', JSON.stringify(event, null, 2));
  const s3 = new S3();
  const sns = new SNS();

  const snsTopic = process.env.SNS_TOPIC_ARN;
  const bucketName = process.env.BUCKET_NAME;
  const allowedChannels: AllowedChannels[] = ['instagram', 'facebook', 'whatsapp', 'email'];

  try {
    // Validate file type
    if (event.headers['Content-Type'] !== 'text/csv') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid file type',
        }),
      };
    }

    const fileContent =
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, 'base64')
        : event.body
          ? Buffer.from(event.body, 'utf-8')
          : null;
    if (!fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing file',
        }),
      };
    }
    const records: CSVRecord[] = await parseCSV(fileContent);

    // Validate CSV length
    if (records.length !== 1000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'CSV must contain exactly 1000 records',
        }),
      };
    }

    // Validate headers
    const headers = Object.keys(records[0]);
    if (
      !headers.includes('sender_username') ||
      !headers.includes('receiver_username') ||
      !headers.includes('channel') ||
      !headers.includes('message')
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'CSV contains invalid headers',
        }),
      };
    }

    // Validate each record channel value
    const errors: string[] = [];
    for (const record of records) {
      const { channel } = record;
      if (!allowedChannels.includes(channel.toLowerCase() as AllowedChannels)) {
        errors.push(`Invalid channel: ${channel} on line ${records.indexOf(record) + 2}`);
      }
    }

    if (errors.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Errors occurred', errors }),
      };
    }

    // Generate a unique key for the S3 object
    const uniqueKey = `uploads/${Date.now()}-${uuid()}.csv`;

    // Upload the entire CSV to the bucket
    try {
      const params = {
        Bucket: bucketName || '',
        Key: uniqueKey,
        Body: fileContent,
        ContentType: 'text/csv',
      };
      await s3.upload(params).promise();
    } catch (error) {
      console.error('Error uploading file to S3:', error);
    }

    // Publish a message to SNS to notify the next service
    try {
      await sns
        .publish({
          TopicArn: snsTopic,
          Message: JSON.stringify({
            message: 'CSV uploaded successfully',
            bucketName: bucketName,
            bucketKey: uniqueKey,
          }),
        })
        .promise();
    } catch (error) {
      console.error('Error publishing message to SNS:', error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'CSV uploaded successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing the CSV',
        error: error,
      }),
    };
  }
};
