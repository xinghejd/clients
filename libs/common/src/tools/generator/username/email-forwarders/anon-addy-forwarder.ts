import { ApiService } from "../../../../abstractions/api.service";
import { I18nService } from "../../../../platform/abstractions/i18n.service";

import { EmailDomainOptions, Forwarder, SelfHostedApiOptions } from "./forwarder";

export class AnonAddyForwarder implements Forwarder {
  readonly serviceName: string;

  constructor(private apiService: ApiService, private i18nService: I18nService) {
    this.serviceName = i18nService.t("forwarder.serviceName.anonaddy");
  }

  async generate(
    website: string | null,
    options: SelfHostedApiOptions & EmailDomainOptions
  ): Promise<string> {
    if (!options.token || options.token === "") {
      const error = this.i18nService.t("forwaderInvalidToken", this.serviceName);
      throw error;
    }
    if (!options.domain || options.domain === "") {
      const error = this.i18nService.t("forwarderNoDomain", this.serviceName);
      throw error;
    }
    if (!options.baseUrl || options.baseUrl === "") {
      const error = this.i18nService.t("forwarderNoUrl", this.serviceName);
      throw error;
    }

    const descriptionId =
      website && website !== "" ? "forwarderGeneratedByWithWebsite" : "forwarderGeneratedBy";
    const description = this.i18nService.t(descriptionId, website ?? "");

    const url = options.baseUrl + "/api/v1/aliases";
    const request = new Request(url, {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + options.token,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }),
      body: JSON.stringify({
        domain: options.domain,
        description,
      }),
    });

    const response = await this.apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      return json?.data?.email;
    } else if (response.status === 401) {
      const error = this.i18nService.t("forwaderInvalidToken", this.serviceName);
      throw error;
    } else if (response?.statusText) {
      const error = this.i18nService.t("forwarderError", this.serviceName, response.statusText);
      throw error;
    } else {
      const error = this.i18nService.t("forwarderUnknownError", this.serviceName);
      throw error;
    }
  }
}
