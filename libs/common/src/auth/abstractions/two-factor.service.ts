import { TwoFactorProviderType } from "../enums/two-factor-provider-type";
import { IdentityTwoFactorResponse } from "../models/response/identity-two-factor.response";

export interface TwoFactorProviderDetails {
  type: TwoFactorProviderType;
  name: string;
  description: string;
  priority: number;
  sort: number;
  premium: boolean;
}

export abstract class TwoFactorService {
  abstract init(): void;
  abstract getSupportedProviders(win: Window): TwoFactorProviderDetails[];
  abstract getDefaultProvider(webAuthnSupported: boolean): TwoFactorProviderType;
  abstract setSelectedProvider(type: TwoFactorProviderType): void;
  abstract clearSelectedProvider(): void;

  abstract setProviders(response: IdentityTwoFactorResponse): void;
  abstract clearProviders(): void;
  abstract getProviders(): Map<TwoFactorProviderType, { [key: string]: string }>;
}
