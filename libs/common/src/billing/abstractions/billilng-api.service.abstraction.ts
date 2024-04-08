import { SubscriptionCancellationRequest } from "../../billing/models/request/subscription-cancellation.request";
import { OrganizationBillingStatusResponse } from "../../billing/models/response/organization-billing-status.response";
import { ProviderOrganizationUpdateRequest } from "../models/request/provider-organization-update.request";
import { ProviderSubscriptionResponse } from "../models/response/provider-subscription-response";

export abstract class BillingApiServiceAbstraction {
  cancelOrganizationSubscription: (
    organizationId: string,
    request: SubscriptionCancellationRequest,
  ) => Promise<void>;

  cancelPremiumUserSubscription: (request: SubscriptionCancellationRequest) => Promise<void>;

  getBillingStatus: (id: string) => Promise<OrganizationBillingStatusResponse>;

  getProviderSubscription: (providerId: string) => Promise<ProviderSubscriptionResponse>;

  updateProviderOrganization: (
    providerId: string,
    organizationId: string,
    request: ProviderOrganizationUpdateRequest,
  ) => Promise<any>;
}
