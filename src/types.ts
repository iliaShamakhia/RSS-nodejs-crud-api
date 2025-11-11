export interface User {
  id?: string;
  username: string;
  age: number;
  hobbies: string[];
}

export interface ApiResponse {
  status: number;
  message: string;
  data?: any;
}

export type operationType = 'getSingle' | 'getMany' | 'create' | 'update' | 'delete' | 'user-exists';

export interface OperationMessage {
  type: operationType;
  userId?: string;
  data?: User;
}

export interface UpdateMessage {
  status: 'success' | 'error';
  data?: User | User[];
}