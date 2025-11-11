import request from 'supertest';
import { createServer } from 'http';
import * as routes from '../routes';

const server = createServer(routes.handleRequest);
let userId: string;
let deleted = false;
let createdUser = '';
jest.spyOn(routes, 'handleOperation').mockImplementation(async (type: string, id?: string, data?: any) => {
  if (type === 'getMany') return { status: 'success', data:[] };
  if (type === 'create') return {status: 'success', data:{ id: 'cd81a6b2-f4ea-4986-8bc1-ede7b15fac58', ...data }};
  if (type === 'getSingle') {
    if (!deleted) return {status: 'success', data: { id: userId, username: 'John Doe', age: 30, hobbies: ['reading', 'gaming'] }};
    return { status: 'error' };
  }
  if (type === 'update') {
    if (id === userId) return { status: 'success', data:{ id: userId, ...data }};
    return { status: 'error' };
  }
  if (type === 'delete') {
    if (id === userId) return { status: 'success' };
    return { status: 'error' };
  }
  if (type === 'user-exists') {
    if (createdUser === 'John Doe') return { status: 'success' };
    return { status: 'error' };
  }
  return { status: 'error' };
});


describe('User API', () => {
  
  it('should return an empty array when no users exist', async () => {
    const response = await request(server).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({  status: 'success', data:[] });
  });

  it('should create a new user', async () => {
    const newUser = {
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'gaming'],
    };

    const response = await request(server).post('/api/users').send(newUser);
    expect(response.status).toBe(201);
    expect(response.body.data.data).toHaveProperty('id');
    expect(response.body.data.data.username).toBe(newUser.username);
    expect(response.body.data.data.age).toBe(newUser.age);
    expect(response.body.data.data.hobbies).toEqual(newUser.hobbies);
    userId = response.body.data.data.id;
    createdUser = response.body.data.data.username;
  });

  it('should retrieve the created user by ID', async () => {
    const response = await request(server).get(`/api/users/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body.data.data.id).toBe(userId);
  });

  it('should update the created user', async () => {
    const updatedUser = {
      username: 'Jane Doe',
      age: 25,
      hobbies: ['traveling'],
    };

    const response = await request(server).put(`/api/users/${userId}`).send(updatedUser);
    expect(response.status).toBe(200);
    expect(response.body.data.data.username).toBe(updatedUser.username);
    expect(response.body.data.data.age).toBe(updatedUser.age);
    expect(response.body.data.data.hobbies).toEqual(updatedUser.hobbies);
  });

  it('should delete the created user', async () => {
    const response = await request(server).delete(`/api/users/${userId}`);
    expect(response.status).toBe(204);
    deleted = true;
  });

  it('should return 404 for a deleted user', async () => {
    const response = await request(server).get(`/api/users/${userId}`);
    expect(response.status).toBe(404);
  });
});