import { Observable } from "rxjs";

import { UserId } from "../../types/guid";

export type Urls = {
  base?: string;
  webVault?: string;
  api?: string;
  identity?: string;
  icons?: string;
  notifications?: string;
  events?: string;
  keyConnector?: string;
  scim?: string;
};

export type PayPalConfig = {
  businessId?: string;
  buttonAction?: string;
};

export enum Region {
  US = "US",
  EU = "EU",
  SelfHosted = "Self-hosted",
}

export enum RegionDomain {
  US = "bitwarden.com",
  EU = "bitwarden.eu",
  USQA = "bitwarden.pw",
}

export type SelectableRegion = {
  // Beware this isn't completely true, it's actually a string for custom environments,
  // which are currently only supported in web where it doesn't matter.
  key: Region;
  domain: string;
  urls: {
    vault: string;
  };
};

export abstract class EnvironmentService {
  urls: Observable<void>;
  usUrls: Urls;
  euUrls: Urls;
  selectedRegion?: Region;
  initialized = true;

  /**
   * Retrieve all the available regions for environment selectors.
   *
   * This currently relies on compile time provided constants, and will not change at runtime.
   * Expect all builds to include production environments, QA builds to also include QA
   * environments and dev builds to include localhost.
   */
  availableRegions: () => SelectableRegion[];

  hasBaseUrl: () => boolean;
  getNotificationsUrl: () => string;
  getWebVaultUrl: () => string;
  /**
   * Retrieves the URL of the cloud web vault app.
   *
   * @returns {string} The URL of the cloud web vault app.
   * @remarks Use this method only in views exclusive to self-host instances.
   */
  getCloudWebVaultUrl: () => string;
  /**
   * Sets the URL of the cloud web vault app based on the region parameter.
   *
   * @param {Region} region - The region of the cloud web vault app.
   */
  setCloudWebVaultUrl: (region: Region) => void;

  /**
   * Seed the environment for a given user based on the globally set defaults.
   */
  seedUserEnvironment: (userId: UserId) => Promise<void>;

  getSendUrl: () => string;
  getIconsUrl: () => string;
  getApiUrl: () => string;
  getIdentityUrl: () => string;
  getEventsUrl: () => string;
  getKeyConnectorUrl: () => string;
  getScimUrl: () => string;
  setUrlsFromStorage: () => Promise<void>;
  setUrls: (urls: Urls) => Promise<Urls>;
  getHost: (userId?: string) => Promise<string>;
  setRegion: (region: Region) => Promise<void>;
  getUrls: () => Urls;
  isCloud: () => boolean;
  isEmpty: () => boolean;
}
