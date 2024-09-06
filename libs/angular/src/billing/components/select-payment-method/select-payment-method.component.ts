import { Component, Input } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { PaymentMethodType } from "@bitwarden/common/billing/enums";
import { TokenizedPaymentMethod } from "@bitwarden/common/billing/models/domain";

@Component({
  selector: "app-select-payment-method",
  templateUrl: "./select-payment-method.component.html",
})
export class SelectPaymentMethodComponent {
  @Input() protected showAccountCredit: boolean = true;
  @Input() protected showBankAccount: boolean = true;
  @Input() protected showPayPal: boolean = true;
  @Input() private startWith: PaymentMethodType = PaymentMethodType.Card;
  @Input() protected onSubmit: (tokenizedPaymentMethod: TokenizedPaymentMethod) => Promise<void>;

  protected formGroup = this.formBuilder.group({
    paymentMethod: [this.startWith],
    bankInformation: this.formBuilder.group({
      routingNumber: ["", [Validators.required]],
      accountNumber: ["", [Validators.required]],
      accountHolderName: ["", [Validators.required]],
      accountHolderType: ["", [Validators.required]],
    }),
  });
  protected PaymentMethodType = PaymentMethodType;

  constructor(private formBuilder: FormBuilder) {}

  /**
   * @deprecated The functionality of this unused component is being migrated to the payment-v2.component in web.
   */
  async tokenizePaymentMethod(): Promise<TokenizedPaymentMethod> {
    return Promise.resolve(null);
  }

  submit = async () => {
    const tokenizedPaymentMethod = await this.tokenizePaymentMethod();
    await this.onSubmit(tokenizedPaymentMethod);
  };

  private get selected(): PaymentMethodType {
    return this.formGroup.value.paymentMethod;
  }

  protected get usingAccountCredit(): boolean {
    return this.selected === PaymentMethodType.Credit;
  }

  protected get usingBankAccount(): boolean {
    return this.selected === PaymentMethodType.BankAccount;
  }

  protected get usingCard(): boolean {
    return this.selected === PaymentMethodType.Card;
  }

  protected get usingPayPal(): boolean {
    return this.selected === PaymentMethodType.PayPal;
  }

  private get usingStripe(): boolean {
    return this.usingBankAccount || this.usingCard;
  }
}
