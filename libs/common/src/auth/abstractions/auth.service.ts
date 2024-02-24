import { AuthenticationStatus } from "../enums/authentication-status";

export abstract class AuthService {
  abstract getAuthStatus(userId?: string): Promise<AuthenticationStatus>;
  abstract logOut(callback: () => void): void;
}
