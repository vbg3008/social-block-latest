export interface ApiContract<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}
