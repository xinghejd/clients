import { Observable } from "rxjs";

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
  send?: string;
};

const US_URLS: Urls = {
  base: null,
  api: "https://api.bitwarden.com",
  identity: "https://identity.bitwarden.com",
  icons: "https://icons.bitwarden.net",
  webVault: "https://vault.bitwarden.com",
  notifications: "https://notifications.bitwarden.com",
  events: "https://events.bitwarden.com",
  scim: "https://scim.bitwarden.com",
  send: "https://send.bitwarden.com",
};

const EU_URLS: Urls = {
  base: null,
  api: "https://api.bitwarden.eu",
  identity: "https://identity.bitwarden.eu",
  icons: "https://icons.bitwarden.eu",
  webVault: "https://vault.bitwarden.eu",
  notifications: "https://notifications.bitwarden.eu",
  events: "https://events.bitwarden.eu",
  scim: "https://scim.bitwarden.eu",
  send: "https://send.bitwarden.eu",
};

export class Environment {
  constructor(private region: Region, private urls: Urls) {}

  get hasBaseUrl(): boolean {
    return !!this.urls.base;
  }

  get baseUrl(): string {
    return this.urls.base;
  }

  get notificationsUrl(): string {
    if (this.urls.notifications != null) {
      return this.urls.notifications;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/notifications";
    }

    return US_URLS.notifications;
  }

  get webVaultUrl(): string {
    if (this.urls.webVault != null) {
      return this.urls.webVault;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/vault";
    }

    return US_URLS.webVault;
  }

  get cloudWebVaultUrl(): string {
    if (this.urls.webVault != null) {
      return this.urls.webVault;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/cloud-vault";
    }

    return US_URLS.webVault;
  }

  get sendUrl(): string {
    // TODO MDG: Why does this not handle eu?
    if (this.webVaultUrl === US_URLS.webVault) {
      return US_URLS.send;
    }
    return this.webVaultUrl + "/#/send";
  }

  get iconsUrl(): string {
    if (this.urls.icons != null) {
      return this.urls.icons;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/icons";
    }

    return US_URLS.icons;
  }

  get apiUrl(): string {
    if (this.urls.api != null) {
      return this.urls.api;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/api";
    }

    return US_URLS.api;
  }

  get identityUrl(): string {
    if (this.urls.identity != null) {
      return this.urls.identity;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/identity";
    }

    return US_URLS.identity;
  }

  get eventsUrl(): string {
    if (this.urls.events != null) {
      return this.urls.events;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/events";
    }

    return US_URLS.events;
  }

  get keyConnectorUrl(): string {
    if (this.urls.keyConnector != null) {
      return this.urls.keyConnector;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/key-connector";
    }

    return US_URLS.keyConnector;
  }

  get scimUrl(): string {
    if (this.urls.scim != null) {
      return this.urls.scim;
    }

    if (this.baseUrl != null) {
      return this.baseUrl + "/scim";
    }

    return US_URLS.scim;
  }
}

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

export abstract class EnvironmentService {
  urls: Observable<void>;
  usUrls: Urls;
  euUrls: Urls;
  selectedRegion?: Region;
  initialized = true;

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
  getSendUrl: () => string;
  getIconsUrl: () => string;
  getApiUrl: () => string;
  getIdentityUrl: () => string;
  getEventsUrl: () => string;
  getKeyConnectorUrl: () => string;
  getScimUrl: () => string;
  setUrlsFromStorage: () => Promise<void>;
  setUrls: (urls: Urls) => Promise<Urls>;
  setRegion: (region: Region) => Promise<void>;
  getUrls: () => Urls;
  isCloud: () => boolean;
  isEmpty: () => boolean;
}
