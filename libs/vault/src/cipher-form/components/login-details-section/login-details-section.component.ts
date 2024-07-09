import { DatePipe, NgIf } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { map } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";
import {
  AsyncActionsModule,
  CardComponent,
  FormFieldModule,
  IconButtonModule,
  PopoverModule,
  SectionComponent,
  SectionHeaderComponent,
  TypographyModule,
} from "@bitwarden/components";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

import { CipherFormContainer } from "../../cipher-form-container";

@Component({
  selector: "vault-login-details-section",
  templateUrl: "./login-details-section.component.html",
  standalone: true,
  imports: [
    SectionComponent,
    ReactiveFormsModule,
    SectionHeaderComponent,
    TypographyModule,
    JslibModule,
    CardComponent,
    FormFieldModule,
    IconButtonModule,
    AsyncActionsModule,
    NgIf,
    PopoverModule,
  ],
})
export class LoginDetailsSectionComponent implements OnInit {
  loginDetailsForm = this.formBuilder.group({
    username: [""],
    password: [""],
    totp: [""],
  });

  /**
   * Whether the TOTP field can be captured from the current tab. Only available in the web extension.
   * @protected
   */
  protected get canCaptureTotp() {
    return false; //BrowserApi.isWebExtensionsApi && this.loginDetailsForm.controls.totp.enabled;
  }

  private datePipe = inject(DatePipe);

  private loginView: LoginView;

  get hasPasskey(): boolean {
    return this.loginView?.hasFido2Credentials;
  }

  get fido2CredentialCreationDateValue(): string {
    const dateCreated = this.i18nService.t("dateCreated");
    const creationDate = this.datePipe.transform(
      this.loginView?.fido2Credentials?.[0]?.creationDate,
      "short",
    );
    return `${dateCreated} ${creationDate}`;
  }

  get viewHiddenFields() {
    if (this.cipherFormContainer.originalCipherView) {
      return this.cipherFormContainer.originalCipherView.viewPassword;
    }
    return true;
  }

  constructor(
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private generatorService: PasswordGenerationServiceAbstraction,
  ) {
    this.cipherFormContainer.registerChildForm("loginDetails", this.loginDetailsForm);

    this.loginDetailsForm.valueChanges
      .pipe(
        takeUntilDestroyed(),
        // getRawValue() is used as fields can be disabled when passwords are hidden
        map(() => this.loginDetailsForm.getRawValue()),
      )
      .subscribe((value) => {
        const patchedLogin = Object.assign(this.loginView, {
          username: value.username,
          password: value.password,
          totp: value.totp,
        } as LoginView);

        this.cipherFormContainer.patchCipher({
          login: patchedLogin,
        });
      });
  }

  async ngOnInit() {
    if (this.cipherFormContainer.originalCipherView?.login) {
      this.initFromExistingCipher(this.cipherFormContainer.originalCipherView.login);
    } else {
      await this.initNewCipher();
    }

    if (this.cipherFormContainer.config.mode === "partial-edit") {
      this.loginDetailsForm.disable();
    }
  }

  private initFromExistingCipher(existingLogin: LoginView) {
    this.loginView = existingLogin;
    this.loginDetailsForm.patchValue({
      username: this.loginView.username,
      password: this.loginView.password,
      totp: this.loginView.totp,
    });

    if (!this.viewHiddenFields) {
      this.loginDetailsForm.controls.password.disable();
      this.loginDetailsForm.controls.totp.disable();
    }
  }

  private async initNewCipher() {
    this.loginView = new LoginView();

    this.loginDetailsForm.controls.password.patchValue(await this.generateNewPassword());
  }

  captureTotpFromTab = async () => {};
  removePasskey = async () => {};

  private async generateNewPassword() {
    const [options] = await this.generatorService.getOptions();
    return await this.generatorService.generatePassword(options);
  }
}
