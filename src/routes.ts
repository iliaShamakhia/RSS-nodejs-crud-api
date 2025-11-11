import { IncomingMessage, ServerResponse } from 'http';
import { db } from './db';
import { isIdValid, isUrlValid, isUserDataValid, sendResponse } from './utils';
import { operationType, UpdateMessage, User } from './types';

export const handleOperation = (type: operationType, id?: string, data?: User) => {
  return new Promise<UpdateMessage>(((resolve, reject)=>{
    process.send?.({ type, userId: id, data });
    process.on('message', (message: UpdateMessage) => {
      resolve(message);
      process.removeAllListeners('message');
    });
    process.on('error', (error) => {
      reject(error);
    });
  }))
}

export const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const [_, api, resource, id]: string[] = req.url?.split('/') || [];

  console.log(`worker ${process.pid} handled the request on port: ${process.env.PORT}`);

  if (api !== 'api' || !resource || !isUrlValid(req.url || '')) {
    sendResponse(res, { status: 404, message: 'Endpoint not found' });
    return;
  }

  if (id && !isIdValid(id)) {
    sendResponse(res, { status: 400, message: 'Invalid UUID format' });
    return;
  }

  try {
    if (req.method === 'GET') {
      if (resource === 'users' && !id) {
        const users = await handleOperation('getMany', undefined, undefined);
        sendResponse(res, { status: 200, message: 'Success', data: users });
      } else {
        const user = await handleOperation('getSingle', id, undefined);
        if (user.status === 'success') {
          sendResponse(res, { status: 200, message: 'Success', data: user });
        } else {
          sendResponse(res, { status: 404, message: 'User not found' });
        }
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try{
          const { username, age, hobbies } = JSON.parse(body);
          if (!username || !age || !Array.isArray(hobbies) || !isUserDataValid({username, age, hobbies} as User)) {
            sendResponse(res, { status: 400, message: 'Invalid request body' });
            return;
          }
          const usernameExists = await handleOperation('user-exists', undefined, { username, age, hobbies});
          if (usernameExists.status === 'success') {
            sendResponse(res, { status: 409, message: 'User already exists' });
            return;
          }
          const newUser = await handleOperation('create', undefined, { username, age, hobbies});
          sendResponse(res, { status: 201, message: 'User created', data: newUser });
        }catch{
          sendResponse(res, { status: 400, message: 'Invalid request body' });
        }
      });
    } else if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try{
          const { username, age, hobbies } = JSON.parse(body);
          if (!username || !age || !Array.isArray(hobbies) || !isUserDataValid({username, age, hobbies} as User)) {
            sendResponse(res, { status: 400, message: 'Invalid request body' });
            return;
          }
          const updatedUser = await handleOperation('update', id, { username, age, hobbies});
          if (updatedUser.status == 'success') {
            sendResponse(res, { status: 200, message: 'User updated', data: updatedUser });
          } else {
            sendResponse(res, { status: 404, message: 'User not found' });
          }
        }catch{
          sendResponse(res, { status: 400, message: 'Invalid request body' });
        }
      });
    } else if (req.method === 'DELETE') {
      const isDeleted = await handleOperation('delete', id, undefined);
      if (isDeleted.status === 'success') {
        sendResponse(res, { status: 204, message: 'User deleted' });
      } else {
        sendResponse(res, { status: 404, message: 'User not found' });
      }
    } else {
      sendResponse(res, { status: 405, message: 'Method not allowed' });
    }
  } catch (error) {
    sendResponse(res, { status: 500, message: 'Internal server error' });
  }
};