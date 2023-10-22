import { concatMap, Observable, ReplaySubject } from "rxjs";

import { EnvironmentUrls } from "../../auth/models/domain/environment-urls";
import {
  CloudRegion,
  EnvironmentService as EnvironmentServiceAbstraction,
  Region,
  Urls,
} from "../abstractions/environment.service";
import { LogService } from "../abstractions/log.service";
import { StateService } from "../abstractions/state.service";

export class EnvironmentService implements EnvironmentServiceAbstraction {
  private readonly urlsSubject = new ReplaySubject<void>(1);
  urls$: Observable<void> = this.urlsSubject.asObservable();
  selectedRegion?: Region;
  initialized = false;

  protected urls: Urls = null;
  private cloudWebVaultUrl: string;

  readonly cloudRegionUrls: { [key in CloudRegion]: Urls } = {
    [Region.US]: {
      base: null,
      api: "https://api.bitwarden.com",
      identity: "https://identity.bitwarden.com",
      icons: "https://icons.bitwarden.net",
      webVault: "https://vault.bitwarden.com",
      notifications: "https://notifications.bitwarden.com",
      events: "https://events.bitwarden.com",
      scim: "https://scim.bitwarden.com",
    },
    [Region.EU]: {
      base: null,
      api: "https://api.bitwarden.eu",
      identity: "https://identity.bitwarden.eu",
      icons: "https://icons.bitwarden.eu",
      webVault: "https://vault.bitwarden.eu",
      notifications: "https://notifications.bitwarden.eu",
      events: "https://events.bitwarden.eu",
      scim: "https://scim.bitwarden.eu",
    },
  };

  constructor(
    private stateService: StateService,
    private logService: LogService,
    private loadOnAccountChange = true
  ) {
    if (!this.loadOnAccountChange) {
      return;
    }

    this.stateService.activeAccount$
      .pipe(
        concatMap(async () => {
          if (!this.initialized) {
            this.logService.debug("EnvironmentService not initialized, skipping loadEnvironment");
            return;
          }
          this.logService.debug("Account changed, loading environment");
          // only if we have urls in state, load them
          await this.loadEnvironment();
        })
      )
      .subscribe();
  }

  hasBaseUrl() {
    return this.urls?.base != null;
  }

  getNotificationsUrl() {
    return this.deriveUrl(
      this.urls?.notifications,
      "/notifications",
      "https://notifications.bitwarden.com"
    );
  }

  getWebVaultUrl() {
    return this.deriveUrl(this.urls?.webVault, "", "https://vault.bitwarden.com");
  }

  getIconsUrl() {
    return this.deriveUrl(this.urls?.icons, "/icons", "https://icons.bitwarden.net");
  }

  getApiUrl() {
    return this.deriveUrl(this.urls?.api, "/api", "https://api.bitwarden.com");
  }

  getIdentityUrl() {
    return this.deriveUrl(this.urls?.identity, "/identity", "https://identity.bitwarden.com");
  }

  getEventsUrl() {
    return this.deriveUrl(this.urls?.events, "/events", "https://events.bitwarden.com");
  }

  getCloudWebVaultUrl() {
    if (this.cloudWebVaultUrl != null) {
      return this.cloudWebVaultUrl;
    }
    return this.cloudRegionUrls.US.webVault;
  }

  setCloudWebVaultUrl(region: CloudRegion) {
    this.cloudWebVaultUrl = this.cloudRegionUrls[region].webVault;
  }

  getSendUrl() {
    return this.getWebVaultUrl() === "https://vault.bitwarden.com"
      ? "https://send.bitwarden.com/#"
      : this.getWebVaultUrl() + "/#/send/";
  }

  getKeyConnectorUrl() {
    return this.urls?.keyConnector;
  }

  getScimUrl() {
    if (this.urls?.scim != null) {
      return this.urls?.scim + "/v2";
    }

    return this.getWebVaultUrl() === "https://vault.bitwarden.com"
      ? "https://scim.bitwarden.com/v2"
      : this.getWebVaultUrl() + "/scim/v2";
  }

  /**
   * Load the environment from state
   */
  async loadEnvironment(): Promise<void> {
    const region = await this.stateService.getRegion();

    this.logService.debug("Loading environment for region: " + region);

    // There are two ways we can load the URLs into the service:
    // 1. If the region is stored in state AND is EU or US, we should load the URLs defined for that region
    // 2. Otherwise, we should load the URLs stored individually in state. This will be the case if the region isn't
    //    defined in state, or if the region is SelfHosted.
    if (region == null || region === Region.SelfHosted) {
      const savedUrls = await this.stateService.getEnvironmentUrls();
      this.logService.debug("Loading these URLs from state:" + JSON.stringify(savedUrls));
      this.setEnvironmentBasedOnUrls(savedUrls);
    } else {
      this.logService.debug("Loading configured URLs for region: " + region);
      this.setEnvironmentBasedOnRegion(region);
    }
  }

  /**
   * Set the region whose configured URLs should be provided by the `EnvironmentService`.
   * @param region The the `CloudRegion` whose environment should be provided by `EnvironmentService`.
   */
  async setEnvironmentByRegion(region: CloudRegion) {
    await this.setRegionInState(region);
    await this.setEnvironmentBasedOnRegion(region);
  }

  /**
   * Accepts a set of URLs and defines the client environment based on those URLs, setting the `selectedRegion` to `Region.SelfHosted`.
   * @param urls The URLs to set for the environment.
   * @returns The URLs that were set.
   */
  async setEnvironmentByUrls(urls: Urls): Promise<Urls> {
    this.formatUrls(urls);

    await this.setEnvironmentUrlsInState(urls);
    this.setEnvironmentBasedOnUrls(urls);

    return urls;
  }

  getUrls() {
    return this.urls;
  }

  private async setRegionInState(region: CloudRegion) {
    this.selectedRegion = region;
    await this.stateService.setRegion(region);

    // Since we are setting the region to a configured one, clear the self-hosted URLs
    await this.stateService.setEnvironmentUrls(new EnvironmentUrls());
  }

  private async setEnvironmentUrlsInState(urls: Urls) {
    await this.stateService.setEnvironmentUrls({
      base: urls.base,
      api: urls.api,
      identity: urls.identity,
      webVault: urls.webVault,
      icons: urls.icons,
      notifications: urls.notifications,
      events: urls.events,
      keyConnector: urls.keyConnector,
      // scimUrl is not saved to storage
    });

    // Since we are setting the URLs to a custom definition, set the region to SelfHosted
    await this.stateService.setRegion(Region.SelfHosted);
  }

  private async setEnvironmentBasedOnRegion(region: CloudRegion) {
    this.setEnvironmentBasedOnUrls(this.cloudRegionUrls[region]);
  }

  private setEnvironmentBasedOnUrls(updatedUrls: Urls) {
    this.formatUrls(updatedUrls);
    this.urls = updatedUrls;
    this.urlsSubject.next();
  }

  private deriveUrl(url: string, path: string, fallback: string) {
    if (url != null) {
      return url;
    }

    if (this.urls?.base != null) {
      return this.urls.base + path;
    }

    return fallback;
  }

  private formatUrls(urls: Urls) {
    urls.base = this.formatUrl(urls.base);
    urls.webVault = this.formatUrl(urls.webVault);
    urls.api = this.formatUrl(urls.api);
    urls.identity = this.formatUrl(urls.identity);
    urls.icons = this.formatUrl(urls.icons);
    urls.notifications = this.formatUrl(urls.notifications);
    urls.events = this.formatUrl(urls.events);
    urls.keyConnector = this.formatUrl(urls.keyConnector);
    urls.scim = this.formatUrl(urls.scim) ?? this.urls?.scim; // scimUrl cannot be cleared
  }

  private formatUrl(url: string): string {
    if (url == null || url === "") {
      return null;
    }

    url = url.replace(/\/+$/g, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    return url.trim();
  }

  isCloud(): boolean {
    return [
      "https://api.bitwarden.com",
      "https://vault.bitwarden.com/api",
      "https://api.bitwarden.eu",
      "https://vault.bitwarden.eu/api",
    ].includes(this.getApiUrl());
  }
}
