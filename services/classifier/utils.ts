import { DynamoDB } from 'aws-sdk';
import { OpenAI } from 'openai';
import { v4 as uuid } from 'uuid';

import { AllowedChannels } from '../assets/csv-uploader';

const dynamodb = new DynamoDB.DocumentClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG,
});

// List of allowed intents for classification
const allowedIntents = [
  'Request for international shipping information',
  'Request for refund',
  'Request for order status',
  'Request for product availability',
  'Request for veteran discount',
  'Request for bulk purchase discounts',
  'Request for product return',
  'Request for help with placing an order',
  'Request for cancellation',
];

/**
 * Classifies the intent of a given message using OpenAI's language model.
 *
 * @param message - The message to classify.
 * @returns A promise that resolves to an array of classified intents.
 */
export const classifyIntent = async (message: string): Promise<string[]> => {
  const prompt = `
  You are an AI specialized in e-commerce customer support. Your task is to classify user intents based on their messages. Here's a list of common intents you can classify:
  ${allowedIntents.map((intent) => `- ${intent}`).join('\n')}
  If multiple intents are present, list them separately. Do not output duplicate intents. If the message doesn't match any of the intents, return "Unknown intent."`;

  const response = await openai.completions.create({
    model: process.env.OPENAI_MODEL!,
    prompt: `${prompt}. Message: ${message}`,
    max_tokens: 50,
  });

  const classifiedIntents = response.choices[0].text
    .trim()
    .split('\n')
    .map((intent) => intent.trim());
  return classifiedIntents;
};

/**
 * Validates whether the classified intents from a customer message are correct.
 *
 * @param message - The original customer message.
 * @param predictedIntents - The intents predicted by the classifier.
 * @returns A promise that resolves to a boolean indicating whether the predicted intents are accurate.
 */
export const validateIntent = async (message: string, predictedIntents: string[]): Promise<boolean> => {
  const prompt = `
    You are an AI that validates whether the classified intent from a customer message is correct. Here is the message and predicted intent:
    
    Message: "${message}"
    Predicted intents: ${predictedIntents.join(', ')}

    Do the predicted intents accurately match the message? Answer "Yes" or "No" and provide a brief explanation if necessary.
  `;

  const response = await openai.completions.create({
    model: process.env.OPENAI_MODEL!,
    prompt,
    max_tokens: 50,
  });

  const validation = response.choices[0].text.trim().toLowerCase();
  return validation.startsWith('yes');
};

/**
 * Retrieves a predefined response for a given intent and channel from DynamoDB.
 *
 * @param intent - The classified intent.
 * @param channel - The communication channel.
 * @returns A promise that resolves to the predefined response.
 */
export const getPredefinedResponse = async (intent: string, channel: string): Promise<string> => {
  const params = {
    TableName: process.env.INTENTS_TABLE!,
    Key: { intent, channel },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item?.response || 'Response not found';
};

/**
 * Enhances a given response to make it more personalized and engaging.
 *
 * @param response - The original response to enhance.
 * @param senderUsername - The username of the sender to personalize the response.
 * @returns A promise that resolves to the enhanced response.
 */
export const enhanceResponse = async (response: string, senderUsername: string) => {
  const prompt = `
    You are an AI that enhances customer service responses. Here is the response you need to enhance:
    Response: "${response}"
    Enhance the response to make it more personalized and engaging.
  `;

  const enhancedResponse = await openai.completions.create({
    model: process.env.OPENAI_MODEL!,
    prompt,
    max_tokens: 50,
  });

  const enhancedResponseText = enhancedResponse.choices[0].text.trim();
  const finalResponse = enhancedResponseText.replace('${{sender_username}}', senderUsername);
  return finalResponse;
};

/**
 * Stores a response and related information in DynamoDB.
 *
 * @param params - An object containing the response, sender, receiver, message, intents, and channel.
 * @param params.response - The response to store.
 * @param params.sender - The username of the sender.
 * @param params.receiver - The username of the receiver.
 * @param params.message - The original message.
 * @param params.intents - The classified intents.
 * @param params.channel - The communication channel.
 * @returns A promise that resolves to the result of the DynamoDB put operation.
 */
export const storeResponse = async ({
  response,
  sender,
  receiver,
  message,
  channel,
  intents,
}: {
  response: string;
  sender: string;
  receiver: string;
  message: string;
  intents: string[];
  channel: AllowedChannels;
}): Promise<DynamoDB.PutItemOutput> => {
  const params = {
    TableName: process.env.MESSAGES_TABLE!,
    Item: {
      id: uuid(),
      sender_username: sender,
      receiver_username: receiver,
      message,
      intents,
      channel,
      response,
    },
  };
  return await dynamodb.put(params).promise();
};
