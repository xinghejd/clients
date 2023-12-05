import { ApiService } from "../../../../abstractions/api.service";
import { I18nService } from "../../../../platform/abstractions/i18n.service";

import { Forwarder, SelfHostedApiOptions } from "./forwarder";
import { Forwarders } from "./metadata";

export class SimpleLoginForwarder implements Forwarder {
  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
  ) {}

  async generate(website: string, options: SelfHostedApiOptions): Promise<string> {
    if (!options.token || options.token === "") {
      const error = this.i18nService.t("forwaderInvalidToken", Forwarders.SimpleLogin.name);
      throw error;
    }
    if (!options.baseUrl || options.baseUrl === "") {
      const error = this.i18nService.t("forwarderNoUrl", Forwarders.SimpleLogin.name);
      throw error;
    }

    let url = options.baseUrl + "/api/alias/random/new";
    let noteId = "forwarderGeneratedBy";
    if (website && website !== "") {
      url += "?hostname=" + website;
      noteId = "forwarderGeneratedByWithWebsite";
    }
    const note = this.i18nService.t(noteId, website ?? "");

    const request = new Request(url, {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authentication: options.token,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ note }),
    });

    const response = await this.apiService.nativeFetch(request);
    if (response.status === 401) {
      const error = this.i18nService.t("forwaderInvalidToken", Forwarders.SimpleLogin.name);
      throw error;
    }

    const json = await response.json();
    if (response.status === 200 || response.status === 201) {
      return json.alias;
    } else if (json?.error != null) {
      const error = this.i18nService.t("forwarderError", Forwarders.SimpleLogin.name, json.error);
      throw error;
    } else {
      const error = this.i18nService.t("forwarderUnknownError", Forwarders.SimpleLogin.name);
      throw error;
    }
  }
}
