import { IncomingMessage, ServerResponse } from 'http';
import { db } from './db';
import { sendResponse } from './utils';

export const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const [_, api, resource, id] = req.url?.split('/') || [];

  console.log(`worker ${process.pid} handled the request on port: ${process.env.PORT}`);

  if (api !== 'api' || !resource) {
    sendResponse(res, { status: 404, message: 'Endpoint not found' });
    return;
  }

  try {
    if (req.method === 'GET') {
      if (resource === 'users' && !id) {
        sendResponse(res, { status: 200, message: 'Success', data: db.getAllUsers() });
      } else {
        const user = db.getUserById(id);
        if (user) {
          sendResponse(res, { status: 200, message: 'Success', data: user });
        } else {
          sendResponse(res, { status: 404, message: 'User not found' });
        }
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const { username, age, hobbies } = JSON.parse(body);
        if (!username || !age || !Array.isArray(hobbies)) {
          sendResponse(res, { status: 400, message: 'Invalid request body' });
          return;
        }
        const usernameExists = db.getUserByUsername(username);

        if (usernameExists) {
          sendResponse(res, { status: 409, message: 'User already exists' });
          return;
        }
        const newUser = db.createUser(username, age, hobbies);
        process.send?.({ type: 'update', data: db.getAllUsers() });
        sendResponse(res, { status: 201, message: 'User created', data: newUser });
      });
    } else if (req.method === 'PUT') {

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const { id, username, age, hobbies } = JSON.parse(body);
        if (!username || !age || !Array.isArray(hobbies)) {
          sendResponse(res, { status: 400, message: 'Invalid request body' });
          return;
        }

        const updatedUser = db.updateUser(id, username, age, hobbies);
        if (updatedUser) {
          process.send?.({ type: 'update', data: db.getAllUsers() });
          sendResponse(res, { status: 200, message: 'User updated', data: updatedUser });
        } else {
          sendResponse(res, { status: 404, message: 'User not found' });
        }
      });
    } else if (req.method === 'DELETE') {

      const isDeleted = db.deleteUser(id);
      if (isDeleted) {
        process.send?.({ type: 'update', data: db.getAllUsers() });
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