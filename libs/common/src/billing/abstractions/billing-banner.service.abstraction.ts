import { Observable } from "rxjs";

export abstract class BillingBannerServiceAbstraction {
  abstract paymentMethodBannerStates$: Observable<{ organizationId: string; visible: boolean }[]>;
  abstract setPaymentMethodBannerState(organizationId: string, visible: boolean): Promise<void>;
}
