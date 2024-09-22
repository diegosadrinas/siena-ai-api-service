/**
 * Parses a CSV file content and returns an array of CSV records.
 *
 * @param fileContent - The content of the CSV file, which can be either a Buffer or a Readable stream.
 * @returns A promise that resolves to an array of CSVRecord objects.
 */
import { parseStream } from 'fast-csv';
import { Readable } from 'stream';

import { CSVRecord } from '../assets/csv-uploader';


export const parseCSV = (fileContent: Buffer | Readable): Promise<CSVRecord[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];

    // If fileContent is a buffer, convert it to a readable stream, else we assume it's already a readable stream
    parseStream(fileContent instanceof Buffer ? Readable.from(fileContent) : fileContent, { headers: true })
      .on('data', (row) => {
        records.push(row);
      })
      .on('end', () => {
        resolve(records);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

export interface ApiResponse {
  statusCode: number;
  body: string;
}
