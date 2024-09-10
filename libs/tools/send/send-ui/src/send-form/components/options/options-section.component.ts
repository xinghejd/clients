import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { SendView } from "@bitwarden/common/tools/send/models/view/send.view";
import {
  CardComponent,
  CheckboxModule,
  FormFieldModule,
  IconButtonModule,
  SectionComponent,
  SectionHeaderComponent,
  TypographyModule,
} from "@bitwarden/components";

import { SendFormConfig } from "../../abstractions/send-form-config.service";
import { SendFormContainer } from "../../send-form-container";

@Component({
  selector: "tools-send-options-section",
  templateUrl: "./options-section.component.html",
  standalone: true,
  imports: [
    SectionComponent,
    SectionHeaderComponent,
    TypographyModule,
    JslibModule,
    CardComponent,
    FormFieldModule,
    ReactiveFormsModule,
    IconButtonModule,
    CheckboxModule,
    CommonModule,
  ],
})
export class AdditionalOptionsSectionComponent implements OnInit {
  @Input({ required: true })
  config: SendFormConfig;

  @Input()
  originalSendView: SendView;

  additionalOptionsForm = this.formBuilder.group({
    maxAccessCount: [null as number],
    accessCount: [null as number],
    notes: [null as string],
    password: [null as string],
    hideEmail: [false as boolean],
  });

  get hasPassword(): boolean {
    return (
      this.additionalOptionsForm.value.password !== null &&
      this.additionalOptionsForm.value.password !== ""
    );
  }

  constructor(
    private sendFormContainer: SendFormContainer,
    private formBuilder: FormBuilder,
  ) {
    this.sendFormContainer.registerChildForm("additionalOptions", this.additionalOptionsForm);

    this.additionalOptionsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.sendFormContainer.patchSend((send) => {
        Object.assign(send, {
          maxAccessCount: value.maxAccessCount,
          accessCount: value.accessCount,
          password: value.password,
          hideEmail: value.hideEmail,
          notes: value.notes,
        });
        return send;
      });
    });
  }

  ngOnInit() {
    if (this.sendFormContainer.originalSendView) {
      this.additionalOptionsForm.patchValue({
        maxAccessCount: this.sendFormContainer.originalSendView.maxAccessCount,
        accessCount: this.sendFormContainer.originalSendView.accessCount,
        password: this.sendFormContainer.originalSendView.password,
        hideEmail: this.sendFormContainer.originalSendView.hideEmail,
        notes: this.sendFormContainer.originalSendView.notes,
      });
    }
  }
}
