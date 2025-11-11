import { ServerResponse } from 'http';
import { User, type ApiResponse } from './types';

let portCounter = 0;

export const sendResponse = (res: ServerResponse, response: ApiResponse): void => {
  res.writeHead(response.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
};

export const portOffset = (len: number): number => {
  portCounter = (portCounter + 1) % (len + 1);
  return portCounter;
}

export const isIdValid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export const isUrlValid = (url: string): boolean => {
  let parts = url.split('/');
  if (parts.length > 4) {
    return false;
  }
  return true;
}

export const isUserDataValid = (user: User): boolean => {
  if (!user.username || typeof user.username !== 'string') {
    return false;
  }
  if (!user.age || typeof user.age !== 'number') {
    return false;
  }
  if (!user.hobbies || !Array.isArray(user.hobbies) || !user.hobbies.every(hobby => typeof hobby === 'string')) {
    return false;
  }
  return true;
}
