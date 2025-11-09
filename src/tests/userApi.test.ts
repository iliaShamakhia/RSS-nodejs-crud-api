import request from 'supertest';
import { createServer } from 'http';
import { handleRequest } from '../routes';

const server = createServer(handleRequest);

describe('User API', () => {
  let userId: string;

  it('should return an empty array when no users exist', async () => {
    const response = await request(server).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('should create a new user', async () => {
    const newUser = {
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'gaming'],
    };

    const response = await request(server).post('/api/users').send(newUser);
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.username).toBe(newUser.username);
    expect(response.body.data.age).toBe(newUser.age);
    expect(response.body.data.hobbies).toEqual(newUser.hobbies);
    userId = response.body.data.id;
  });

  it('should retrieve the created user by ID', async () => {
    const response = await request(server).get(`/api/users/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(userId);
  });

  it('should update the created user', async () => {
    const updatedUser = {
      id:userId,
      username: 'Jane Doe',
      age: 25,
      hobbies: ['traveling'],
    };

    const response = await request(server).put(`/api/users/${userId}`).send(updatedUser);
    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe(updatedUser.username);
    expect(response.body.data.age).toBe(updatedUser.age);
    expect(response.body.data.hobbies).toEqual(updatedUser.hobbies);
  });

  it('should delete the created user', async () => {
    const response = await request(server).delete(`/api/users/${userId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 for a deleted user', async () => {
    const response = await request(server).get(`/api/users/${userId}`);
    expect(response.status).toBe(404);
  });
});