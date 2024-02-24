import { SubscriptionCancellationRequest } from "../../billing/models/request/subscription-cancellation.request";

export abstract class BillingApiServiceAbstraction {
  abstract cancelOrganizationSubscription(
    organizationId: string,
    request: SubscriptionCancellationRequest,
  ): Promise<void>;
  abstract cancelPremiumUserSubscription(request: SubscriptionCancellationRequest): Promise<void>;
}
