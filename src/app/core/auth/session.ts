import { CurrentUserResponse } from '../api/api-clients';

// What is kept in localStorage between page loads.
export interface Session {
  accessToken: string;
  refreshToken: string;
  email: string;
  user: CurrentUserResponse | null;
}
