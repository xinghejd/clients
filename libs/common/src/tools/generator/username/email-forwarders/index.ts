import { ApiService } from "../../../../abstractions/api.service";
import { I18nService } from "../../../../platform/abstractions/i18n.service";

import { AnonAddyForwarder } from "./anon-addy-forwarder";
import { DuckDuckGoForwarder } from "./duck-duck-go-forwarder";
import { FastmailForwarder } from "./fastmail-forwarder";
import { FirefoxRelayForwarder } from "./firefox-relay-forwarder";
import { ForwardEmailForwarder } from "./forward-email-forwarder";
import { Forwarder } from "./forwarder";
import { Forwarders } from "./metadata";
import { SimpleLoginForwarder } from "./simple-login-forwarder";

export {
  Forwarder,
  ApiOptions,
  SelfHostedApiOptions,
  EmailDomainOptions,
  EmailPrefixOptions,
} from "./forwarder";

export { Forwarders, ForwarderMetadata, ForwarderId } from "./metadata";

/** Static factory for creating forwarders
 * @param service Identifies the service to create a forwarder for.
 * @param apiService The service used for API calls.
 * @param i18nService The service used for localization.
 * @returns A forwarder for the specified service, or null if the service is not supported.
 */
export function createForwarder(
  service: string,
  apiService: ApiService,
  i18nService: I18nService,
): Forwarder {
  if (service === Forwarders.AddyIo.id) {
    return new AnonAddyForwarder(apiService, i18nService);
  } else if (service === Forwarders.DuckDuckGo.id) {
    return new DuckDuckGoForwarder(apiService, i18nService);
  } else if (service === Forwarders.Fastmail.id) {
    return new FastmailForwarder(apiService, i18nService);
  } else if (service === Forwarders.FirefoxRelay.id) {
    return new FirefoxRelayForwarder(apiService, i18nService);
  } else if (service === Forwarders.ForwardEmail.id) {
    return new ForwardEmailForwarder(apiService, i18nService);
  } else if (service === Forwarders.SimpleLogin.id) {
    return new SimpleLoginForwarder(apiService, i18nService);
  } else {
    return null;
  }
}
