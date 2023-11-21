import { ApiService } from "../../../../abstractions/api.service";
import { I18nService } from "../../../../platform/abstractions/i18n.service";

import { ApiOptions, Forwarder } from "./forwarder";

export class DuckDuckGoForwarder implements Forwarder {
  readonly serviceName: string;

  constructor(private apiService: ApiService, private i18nService: I18nService) {
    this.serviceName = i18nService.t("forwarder.serviceName.duckduckgo");
  }

  async generate(_website: string | null, options: ApiOptions): Promise<string> {
    if (!options.token || options.token === "") {
      const error = this.i18nService.t("forwarder.invalidToken", this.serviceName);
      throw error;
    }

    const url = "https://quack.duckduckgo.com/api/email/addresses";
    const request = new Request(url, {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + options.token,
        "Content-Type": "application/json",
      }),
    });

    const response = await this.apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      if (json.address) {
        return `${json.address}@duck.com`;
      } else {
        const error = this.i18nService.t("forwarder.unknownError", this.serviceName);
        throw error;
      }
    } else if (response.status === 401) {
      const error = this.i18nService.t("forwarder.invalidToken", this.serviceName);
      throw error;
    } else {
      const error = this.i18nService.t("forwarder.unknownError", this.serviceName);
      throw error;
    }
  }
}
