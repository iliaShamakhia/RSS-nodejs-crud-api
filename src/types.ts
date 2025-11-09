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