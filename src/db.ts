import { type User } from './types';
import { randomUUID } from 'crypto';

let users: User[] = [];

export const db = {
  
  setUsers: (newUsers: User[]): void => {
    users = newUsers;
  },

  getAllUsers: (): User[] => users,

  getUserByUsername: (username: string): boolean => {
    return users.some(user => user.username === username);
  },

  getUserById: (id: string): User | undefined => users.find(user => user.id === id),

  createUser: (username: string, age: number, hobbies: string[]): User => {
    const newUser: User = { id: randomUUID(), username, age, hobbies };
    users.push(newUser);
    return newUser;
  },

  updateUser: (id: string, username: string, age: number, hobbies: string[]): User | undefined => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    const updatedUser: User = { id, username, age, hobbies };
    users[userIndex] = updatedUser;
    return updatedUser;
  },

  deleteUser: (id: string): boolean => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  },
};