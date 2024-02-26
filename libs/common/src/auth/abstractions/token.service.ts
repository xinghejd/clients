import { IdentityTokenResponse } from "../models/response/identity-token.response";

export abstract class TokenService {
  abstract setTokens(
    accessToken: string,
    refreshToken: string,
    clientIdClientSecret: [string, string],
  ): Promise<any>;
  abstract setToken(token: string): Promise<any>;
  abstract getToken(): Promise<string>;
  abstract setRefreshToken(refreshToken: string): Promise<any>;
  abstract getRefreshToken(): Promise<string>;
  abstract setClientId(clientId: string): Promise<any>;
  abstract getClientId(): Promise<string>;
  abstract setClientSecret(clientSecret: string): Promise<any>;
  abstract getClientSecret(): Promise<string>;
  abstract setTwoFactorToken(tokenResponse: IdentityTokenResponse): Promise<any>;
  abstract getTwoFactorToken(): Promise<string>;
  abstract clearTwoFactorToken(): Promise<any>;
  abstract clearToken(userId?: string): Promise<any>;
  abstract decodeToken(token?: string): Promise<any>;
  abstract getTokenExpirationDate(): Promise<Date>;
  abstract tokenSecondsRemaining(offsetSeconds?: number): Promise<number>;
  abstract tokenNeedsRefresh(minutes?: number): Promise<boolean>;
  abstract getUserId(): Promise<string>;
  abstract getEmail(): Promise<string>;
  abstract getEmailVerified(): Promise<boolean>;
  abstract getName(): Promise<string>;
  abstract getIssuer(): Promise<string>;
  abstract getIsExternal(): Promise<boolean>;
}
