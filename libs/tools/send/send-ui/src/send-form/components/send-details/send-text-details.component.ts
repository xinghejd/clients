import { CommonModule, DatePipe } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { SendView } from "@bitwarden/common/tools/send/models/view/send.view";
import {
  CardComponent,
  CheckboxModule,
  FormFieldModule,
  IconButtonModule,
  SectionComponent,
  SectionHeaderComponent,
  SelectModule,
  TypographyModule,
} from "@bitwarden/components";

import { SendFormConfig } from "../../abstractions/send-form-config.service";
import { SendFormContainer } from "../../send-form-container";

// Value = hours
enum DatePreset {
  OneHour = 1,
  OneDay = 24,
  TwoDays = 48,
  ThreeDays = 72,
  SevenDays = 168,
  ThirtyDays = 720,
  Custom = 0,
  Never = null,
}

interface DatePresetSelectOption {
  name: string;
  value: DatePreset;
}

@Component({
  selector: "tools-send-text-details",
  templateUrl: "./send-text-details.component.html",
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
    SelectModule,
  ],
})
export class SendTextDetailsComponent implements OnInit {
  @Input({ required: true })
  config: SendFormConfig;

  @Input()
  originalSendView: SendView;

  sendTextDetailsForm = this.formBuilder.group({
    name: ["", [Validators.required]],
    textToShare: [""],
    hideTextByDefault: [false],
    // sendLink: [null as string],
    defaultDeletionDateTime: ["", Validators.required],
    selectedDeletionDatePreset: [DatePreset.SevenDays, Validators.required],
  });

  deletionDatePresets: DatePresetSelectOption[] = [
    { name: this.i18nService.t("oneHour"), value: DatePreset.OneHour },
    { name: this.i18nService.t("oneDay"), value: DatePreset.OneDay },
    { name: this.i18nService.t("days", "2"), value: DatePreset.TwoDays },
    { name: this.i18nService.t("days", "3"), value: DatePreset.ThreeDays },
    { name: this.i18nService.t("days", "7"), value: DatePreset.SevenDays },
    { name: this.i18nService.t("days", "30"), value: DatePreset.ThirtyDays },
    { name: this.i18nService.t("custom"), value: DatePreset.Custom },
  ];

  constructor(
    private sendFormContainer: SendFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    protected datePipe: DatePipe,
  ) {
    this.sendFormContainer.registerChildForm("sendTextDetailsForm", this.sendTextDetailsForm);

    this.sendTextDetailsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.sendFormContainer.patchSend((send) => {
        Object.assign(send, {
          name: value.name,
          text: { text: value.textToShare, hidden: value.hideTextByDefault },
          deletionDate: new Date(this.formattedDeletionDate),
          expirationDate: new Date(this.formattedDeletionDate),
        } as SendView);
        return send;
      });
    });
  }

  async ngOnInit() {
    if (this.originalSendView) {
      this.sendTextDetailsForm.patchValue({
        name: this.originalSendView.name,
        textToShare: this.originalSendView.text.text,
        hideTextByDefault: this.originalSendView.text.hidden,
        defaultDeletionDateTime: this.datePipe.transform(
          new Date(this.originalSendView.deletionDate),
          "yyyy-MM-ddTHH:mm",
        ),
        selectedDeletionDatePreset:
          this.config.mode === "edit" ? DatePreset.Custom : DatePreset.SevenDays,
      });
    }

    this.sendTextDetailsForm.controls.selectedDeletionDatePreset.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((datePreset) => {
        datePreset === DatePreset.Custom
          ? this.sendTextDetailsForm.controls.defaultDeletionDateTime.enable()
          : this.sendTextDetailsForm.controls.defaultDeletionDateTime.disable();
      });
  }

  get formattedDeletionDate(): string {
    switch (this.sendTextDetailsForm.controls.selectedDeletionDatePreset.value as DatePreset) {
      case DatePreset.Never:
        this.sendTextDetailsForm.controls.selectedDeletionDatePreset.patchValue(
          DatePreset.SevenDays,
        );
        return this.formattedDeletionDate;
      case DatePreset.Custom:
        return this.sendTextDetailsForm.controls.defaultDeletionDateTime.value;
      default: {
        const now = new Date();
        const milliseconds = now.setTime(
          now.getTime() +
            (this.sendTextDetailsForm.controls.selectedDeletionDatePreset.value as number) *
              60 *
              60 *
              1000,
        );
        return new Date(milliseconds).toString();
      }
    }
  }
}
