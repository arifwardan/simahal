export enum UserRole {
  ADMIN = 'ADMIN',
  GURU = 'GURU',
  ORANG_TUA = 'ORANG_TUA',
  MURID = 'MURID'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}