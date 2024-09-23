import { Injectable } from "@angular/core";

import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { OrganizationSubscriptionResponse } from "@bitwarden/common/billing/models/response/organization-subscription.response";

@Injectable({ providedIn: "root" })
export class TrialFlowService {
  private trialRemainingDays: number = 0;
  checkForOrgsWithUpcomingPaymentIssues(
    org: OrganizationSubscriptionResponse,
    organization: Organization,
  ): { isOwner: boolean; isTrialing: boolean; trialRemainingDays: number } {
    const trialEndDate = org?.subscription?.trialEndDate;
    const isOwner = organization?.isOwner;
    const isTrialing = org.subscription.status == "trialing";
    if (trialEndDate) {
      const today = new Date();
      const trialEnd = new Date(trialEndDate);
      const timeDifference = trialEnd.getTime() - today.getTime();
      this.trialRemainingDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    }
    const trialRemainingDays = this.trialRemainingDays;
    return { isOwner, isTrialing, trialRemainingDays };
  }
}
