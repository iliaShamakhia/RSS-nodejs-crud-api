import { type ApiResponse } from './types';

let portCounter = 0;

export const sendResponse = (res: any, response: ApiResponse): void => {
  res.writeHead(response.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
};

export const portOffset = (len: number): number => {
  portCounter = (portCounter + 1) % len;
  return portCounter;
}
