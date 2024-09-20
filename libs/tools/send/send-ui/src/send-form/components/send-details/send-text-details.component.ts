import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { SendView } from "@bitwarden/common/tools/send/models/view/send.view";
import { CheckboxModule, FormFieldModule, SectionComponent } from "@bitwarden/components";

import { SendFormConfig } from "../../abstractions/send-form-config.service";
import { SendFormContainer } from "../../send-form-container";

@Component({
  selector: "tools-send-text-details",
  templateUrl: "./send-text-details.component.html",
  standalone: true,
  imports: [
    CheckboxModule,
    CommonModule,
    JslibModule,
    ReactiveFormsModule,
    FormFieldModule,
    SectionComponent,
  ],
})
export class SendTextDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() config: SendFormConfig;
  @Input() originalSendView?: SendView;

  sendTextDetailsForm = this.formBuilder.group({
    text: new FormControl("", Validators.required),
    hidden: new FormControl(false),
  });

  constructor(
    private formBuilder: FormBuilder,
    protected sendFormContainer: SendFormContainer,
    private policyService: PolicyService,
  ) {
    this.sendFormContainer.registerChildForm("sendTextDetailsForm", this.sendTextDetailsForm);

    this.sendTextDetailsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.sendFormContainer.patchSend((send) => {
        return Object.assign(send, {
          text: {
            text: value.text,
            hidden: value.hidden,
          },
        });
      });
    });
  }

  ngOnInit() {
    if (this.originalSendView) {
      this.sendTextDetailsForm.patchValue({
        text: this.originalSendView.text?.text || "",
        hidden: this.originalSendView.text?.hidden || false,
      });
    }

    this.policyService
      .policyAppliesToActiveUser$(PolicyType.DisableSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe((policyAppliesToActiveUser) => {
        if (policyAppliesToActiveUser) {
          this.sendTextDetailsForm.disable();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
