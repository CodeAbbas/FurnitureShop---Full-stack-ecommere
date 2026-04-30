export interface AuthResponse {
  admin: boolean;
  message: string;
  token: string;
}


export interface LoginPayload {
  email: string;
  password: string;
}


export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}