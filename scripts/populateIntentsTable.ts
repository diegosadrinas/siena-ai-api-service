/**
 * Populates the DynamoDB table with predefined intent responses.
 *
 * This script inserts a set of predefined responses into a DynamoDB table specified by the `INTENTS_TABLE` environment variable.
 * Each response is associated with an intent and a communication channel, and contains a templated response message.
 *
 * The responses cover the given intents for the challenge:
 * - Request for international shipping information
 * - Request for veteran discount
 * - Request for bulk purchase discounts
 * - Request for product return
 * - Request for help with placing an order
 * - Request for cancellation
 * - Request for refund
 * - Request for order status
 * - Request for product availability
 *
 * The script uses the AWS SDK's `DynamoDB.DocumentClient` to interact with the DynamoDB table.
 * It iterates over the predefined responses and inserts each one into the table.
 *
 * If an error occurs during the insertion of an item, it logs the error to the console.
 *
 * @module populateIntentsTable
 */
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({ region: 'us-east-1' });
const tableName = 'IntentsTable';

const responses = [
  {
    intent: 'Request for international shipping information',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we offer international shipping in 50 countries.',
  },
  {
    intent: 'Request for veteran discount',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we offer a 10% discount to veterans.',
  },
  {
    intent: 'Request for veteran discount',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we provide a 10% discount for veterans.',
  },
  {
    intent: 'Request for veteran discount',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, veterans get a 10% discount.',
  },
  {
    intent: 'Request for veteran discount',
    channel: 'email',
    response: 'Dear {{sender_username}}, we offer a 10% discount to veterans.',
  },
  {
    intent: 'Request for bulk purchase discounts',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we offer bulk purchase discounts for orders over $500.',
  },
  {
    intent: 'Request for bulk purchase discounts',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we provide discounts for bulk purchases over $500.',
  },
  {
    intent: 'Request for bulk purchase discounts',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, bulk purchases over $500 get discounts.',
  },
  {
    intent: 'Request for bulk purchase discounts',
    channel: 'email',
    response: 'Dear {{sender_username}}, we offer discounts for bulk purchases over $500.',
  },
  {
    intent: 'Request for product return',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we accept returns within 30 days of purchase.',
  },
  {
    intent: 'Request for product return',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we have a 30-day return policy.',
  },
  {
    intent: 'Request for product return',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, you can return products within 30 days of purchase.',
  },
  {
    intent: 'Request for product return',
    channel: 'email',
    response: 'Dear {{sender_username}}, you can return products within 30 days of purchase.',
  },
  {
    intent: 'Request for help with placing an order',
    channel: 'instagram',
    response:
      'Hey {{sender_username}}, we can assist you with placing an order. Please provide your contact information.',
  },
  {
    intent: 'Request for help with placing an order',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we can help you place an order. Please share your contact details.',
  },
  {
    intent: 'Request for help with placing an order',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, we can help you with your order. Please provide your contact information.',
  },
  {
    intent: 'Request for help with placing an order',
    channel: 'email',
    response: 'Dear {{sender_username}}, we can assist you with placing an order. Please share your contact details.',
  },
  {
    intent: 'Request for cancellation',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we can help you cancel your order. Please provide your order number.',
  },
  {
    intent: 'Request for cancellation',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we can assist you with order cancellations. Please share your order number.',
  },
  {
    intent: 'Request for cancellation',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, we can help you cancel your order. Please provide your order number.',
  },
  {
    intent: 'Request for cancellation',
    channel: 'email',
    response: 'Dear {{sender_username}}, we can assist you with order cancellations. Please share your order number.',
  },
  {
    intent: 'Request for refund',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, we offer refunds within 7 business days of processing.',
  },
  {
    intent: 'Request for refund',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, we provide refunds within 7 business days of processing.',
  },
  {
    intent: 'Request for refund',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, refunds are processed within 7 business days.',
  },
  {
    intent: 'Request for refund',
    channel: 'email',
    response: 'Dear {{sender_username}}, we offer refunds within 7 business days of processing.',
  },
  {
    intent: 'Request for order status',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, your order is currently being processed.',
  },
  {
    intent: 'Request for order status',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, your order is in progress.',
  },
  {
    intent: 'Request for order status',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, your order is being processed.',
  },
  {
    intent: 'Request for order status',
    channel: 'email',
    response: 'Dear {{sender_username}}, your order is currently being processed.',
  },
  {
    intent: 'Request for product availability',
    channel: 'instagram',
    response: 'Hey {{sender_username}}, the product is currently in stock.',
  },
  {
    intent: 'Request for product availability',
    channel: 'facebook',
    response: 'Hello {{sender_username}}, the product is available.',
  },
  {
    intent: 'Request for product availability',
    channel: 'whatsapp',
    response: 'Hi {{sender_username}}, the product is in stock.',
  },
  {
    intent: 'Request for product availability',
    channel: 'email',
    response: 'Dear {{sender_username}}, the product is currently available.',
  },
];

const populateTable = async () => {
  for (const response of responses) {
    const params = {
      TableName: tableName,
      Item: response,
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`Inserted item: ${JSON.stringify(response)}`);
    } catch (error) {
      console.error(`Error inserting item: ${JSON.stringify(response)}`, error);
    }
  }
};

populateTable();
