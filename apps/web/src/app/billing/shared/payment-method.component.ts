import { Location } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { PaymentMethodType } from "@bitwarden/common/billing/enums";
import { BillingPaymentResponse } from "@bitwarden/common/billing/models/response/billing-payment.response";
import { OrganizationSubscriptionResponse } from "@bitwarden/common/billing/models/response/organization-subscription.response";
import { SubscriptionResponse } from "@bitwarden/common/billing/models/response/subscription.response";
import { VerifyBankRequest } from "@bitwarden/common/models/request/verify-bank.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService, ToastService } from "@bitwarden/components";

import { AddCreditDialogResult, openAddCreditDialog } from "./add-credit-dialog.component";
import {
  AdjustPaymentDialogResult,
  openAdjustPaymentDialog,
} from "./adjust-payment-dialog/adjust-payment-dialog.component";
import { TaxInfoComponent } from "./tax-info.component";

@Component({
  templateUrl: "payment-method.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class PaymentMethodComponent implements OnInit, OnDestroy {
  @ViewChild(TaxInfoComponent) taxInfo: TaxInfoComponent;

  loading = false;
  firstLoaded = false;
  billing: BillingPaymentResponse;
  org: OrganizationSubscriptionResponse;
  sub: SubscriptionResponse;
  paymentMethodType = PaymentMethodType;
  organizationId: string;
  isUnpaid = false;
  isOwner: boolean = false;
  isTrailing: boolean;
  defaultPaymentSource: BillingPaymentResponse;
  trialRemainingDays: number;
  organization: Organization;

  verifyBankForm = this.formBuilder.group({
    amount1: new FormControl<number>(null, [
      Validators.required,
      Validators.max(99),
      Validators.min(0),
    ]),
    amount2: new FormControl<number>(null, [
      Validators.required,
      Validators.max(99),
      Validators.min(0),
    ]),
  });

  taxForm = this.formBuilder.group({});
  launchPaymentModalAutomatically = false;

  constructor(
    protected apiService: ApiService,
    protected organizationApiService: OrganizationApiServiceAbstraction,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    private router: Router,
    private location: Location,
    private logService: LogService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private toastService: ToastService,
    private organizationService: OrganizationService,
  ) {
    const state = this.router.getCurrentNavigation()?.extras?.state;
    // incase the above state is undefined or null we use redundantState
    const redundantState: any = location.getState();
    if (state && Object.prototype.hasOwnProperty.call(state, "launchPaymentModalAutomatically")) {
      this.launchPaymentModalAutomatically = state.launchPaymentModalAutomatically;
    } else if (
      redundantState &&
      Object.prototype.hasOwnProperty.call(redundantState, "launchPaymentModalAutomatically")
    ) {
      this.launchPaymentModalAutomatically = redundantState.launchPaymentModalAutomatically;
    } else {
      this.launchPaymentModalAutomatically = false;
    }
  }

  async ngOnInit() {
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.params.subscribe(async (params) => {
      if (params.organizationId) {
        this.organizationId = params.organizationId;
      } else if (this.platformUtilsService.isSelfHost()) {
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(["/settings/subscription"]);
        return;
      }

      await this.load();
      this.firstLoaded = true;
    });
  }

  load = async () => {
    if (this.loading) {
      return;
    }
    this.loading = true;
    if (this.forOrganization) {
      const billingPromise = this.organizationApiService.getBilling(this.organizationId);
      const organizationSubscriptionPromise = this.organizationApiService.getSubscription(
        this.organizationId,
      );
      const organizationPromise = await this.organizationService.get(this.organizationId);

      [this.billing, this.org, this.organization] = await Promise.all([
        billingPromise,
        organizationSubscriptionPromise,
        organizationPromise,
      ]);
      this.identifyOrganizationsWithUpcomingPaymentIssues();
    } else {
      const billingPromise = this.apiService.getUserBillingPayment();
      const subPromise = this.apiService.getUserSubscription();

      [this.billing, this.sub] = await Promise.all([billingPromise, subPromise]);
      this.identifyOrganizationsWithUpcomingPaymentIssues();
    }
    this.isUnpaid = this.subscription?.status === "unpaid" ?? false;
    this.loading = false;
    if (this.launchPaymentModalAutomatically) {
      window.setTimeout(() => {
        this.triggerPaymentModal();
        this.launchPaymentModalAutomatically = false;
        this.location.replaceState(this.location.path(), "", {});
      }, 800);
    }
  };

  triggerPaymentModal() {
    (document.querySelector(".payment_trigger_button")! as HTMLButtonElement).click();
  }

  addCredit = async () => {
    const dialogRef = openAddCreditDialog(this.dialogService, {
      data: {
        organizationId: this.organizationId,
      },
    });
    const result = await lastValueFrom(dialogRef.closed);
    if (result === AddCreditDialogResult.Added) {
      await this.load();
    }
  };

  changePayment = async () => {
    const dialogRef = openAdjustPaymentDialog(this.dialogService, {
      data: {
        organizationId: this.organizationId,
        currentType: this.paymentSource !== null ? this.paymentSource.type : null,
      },
    });
    const result = await lastValueFrom(dialogRef.closed);
    if (result === AdjustPaymentDialogResult.Adjusted) {
      this.location.replaceState(this.location.path(), "", {});
      await this.load();
    }
  };

  verifyBank = async () => {
    if (this.loading || !this.forOrganization) {
      return;
    }

    const request = new VerifyBankRequest();
    request.amount1 = this.verifyBankForm.value.amount1;
    request.amount2 = this.verifyBankForm.value.amount2;
    await this.organizationApiService.verifyBank(this.organizationId, request);
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("verifiedBankAccount"),
    });
    await this.load();
  };

  submitTaxInfo = async () => {
    await this.taxInfo.submitTaxInfo();
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("taxInfoUpdated"),
    });
  };

  identifyOrganizationsWithUpcomingPaymentIssues() {
    const trialEndDate = this.org?.subscription?.trialEndDate;
    this.isOwner = this.organization?.isOwner;
    this.isTrailing = this.org.subscription.status == "trialing";
    this.defaultPaymentSource = this.billing;
    if (trialEndDate) {
      const today = new Date();
      const trialEnd = new Date(trialEndDate);
      const timeDifference = trialEnd.getTime() - today.getTime();
      this.trialRemainingDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    }
  }

  async navigateToPaymentMethod() {
    await this.router.navigate(
      ["organizations", `${this.organizationId}`, "billing", "payment-method"],
      {
        state: { launchPaymentModalAutomatically: true },
      },
    );
  }

  get isCreditBalance() {
    return this.billing == null || this.billing.balance <= 0;
  }

  get creditOrBalance() {
    return Math.abs(this.billing != null ? this.billing.balance : 0);
  }

  get paymentSource() {
    return this.billing != null ? this.billing.paymentSource : null;
  }

  get forOrganization() {
    return this.organizationId != null;
  }

  get headerClass() {
    return this.forOrganization ? ["page-header"] : ["tabbed-header"];
  }

  get paymentSourceClasses() {
    if (this.paymentSource == null) {
      return [];
    }
    switch (this.paymentSource.type) {
      case PaymentMethodType.Card:
        return ["bwi-credit-card"];
      case PaymentMethodType.BankAccount:
        return ["bwi-bank"];
      case PaymentMethodType.Check:
        return ["bwi-money"];
      case PaymentMethodType.PayPal:
        return ["bwi-paypal text-primary"];
      default:
        return [];
    }
  }

  get subscription() {
    return this.sub?.subscription ?? this.org?.subscription ?? null;
  }

  ngOnDestroy(): void {
    this.launchPaymentModalAutomatically = false;
  }
}
