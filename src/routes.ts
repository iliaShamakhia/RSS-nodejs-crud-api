import { IncomingMessage, ServerResponse } from 'http';
import { db } from './db';
import { isValidUuid, sendResponse } from './utils';

export const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const [_, api, resource, id] = req.url?.split('/') || [];

  if (api !== 'api' || !resource) {
    sendResponse(res, { status: 404, message: 'Endpoint not found' });
    return;
  }

  try {
    if (req.method === 'GET') {
      if (resource === 'users' && !id) {
        sendResponse(res, { status: 200, message: 'Success', data: db.getAllUsers() });
      } else if (isValidUuid(id)) {
        const user = db.getUserById(id);
        if (user) {
          sendResponse(res, { status: 200, message: 'Success', data: user });
        } else {
          sendResponse(res, { status: 404, message: 'User not found' });
        }
      } else {
        sendResponse(res, { status: 400, message: 'Invalid user ID' });
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const { username, age, hobbies } = JSON.parse(body);
        if (!username || !age || !Array.isArray(hobbies)) {
          sendResponse(res, { status: 400, message: 'Invalid request body' });
          return;
        }
        const newUser = db.createUser(username, age, hobbies);
        sendResponse(res, { status: 201, message: 'User created', data: newUser });
      });
    } else if (req.method === 'PUT') {
      if (!isValidUuid(id)) {
        sendResponse(res, { status: 400, message: 'Invalid user ID' });
        return;
      }

      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const { username, age, hobbies } = JSON.parse(body);
        if (!username || !age || !Array.isArray(hobbies)) {
          sendResponse(res, { status: 400, message: 'Invalid request body' });
          return;
        }

        const updatedUser = db.updateUser(id, username, age, hobbies);
        if (updatedUser) {
          sendResponse(res, { status: 200, message: 'User updated', data: updatedUser });
        } else {
          sendResponse(res, { status: 404, message: 'User not found' });
        }
      });
    } else if (req.method === 'DELETE') {
      if (!isValidUuid(id)) {
        sendResponse(res, { status: 400, message: 'Invalid user ID' });
        return;
      }

      const isDeleted = db.deleteUser(id);
      if (isDeleted) {
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