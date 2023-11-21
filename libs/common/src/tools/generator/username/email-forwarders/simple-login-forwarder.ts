import { ApiService } from "../../../../abstractions/api.service";
import { I18nService } from "../../../../platform/abstractions/i18n.service";

import { Forwarder, SelfHostedApiOptions } from "./forwarder";

export class SimpleLoginForwarder implements Forwarder {
  readonly serviceName: string;

  constructor(private apiService: ApiService, private i18nService: I18nService) {
    this.serviceName = i18nService.t("forwarder.serviceName.simplelogin");
  }

  async generate(website: string, options: SelfHostedApiOptions): Promise<string> {
    if (!options.token || options.token === "") {
      const error = this.i18nService.t("forwarder.invalidToken", this.serviceName);
      throw error;
    }

    let url = options.baseUrl + "/api/alias/random/new";
    let noteId = "forwarder.generatedBy";
    if (website && website !== "") {
      url += "?hostname=" + website;
      noteId = "forwarder.generatedByWithWebsite";
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
      const error = this.i18nService.t("forwarder.invalidToken", this.serviceName);
      throw error;
    }

    const json = await response.json();
    if (response.status === 200 || response.status === 201) {
      return json.alias;
    } else if (json?.error != null) {
      const error = this.i18nService.t("forwarder.error", this.serviceName, json.error);
      throw error;
    } else {
      const error = this.i18nService.t("forwarder.unknownError", this.serviceName);
      throw error;
    }
  }
}
