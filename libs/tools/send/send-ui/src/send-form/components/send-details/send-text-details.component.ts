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
  FourteenDays = 336,
  ThirtyDays = 720,
}

interface DatePresetSelectOption {
  name: string;
  value: DatePreset | string;
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
    selectedDeletionDatePreset: [DatePreset.SevenDays || "", Validators.required],
  });

  customDeletionDateOption: DatePresetSelectOption | null = null;
  datePresetOptions: DatePresetSelectOption[] = [];

  constructor(
    private sendFormContainer: SendFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    protected datePipe: DatePipe,
  ) {
    this.sendFormContainer.registerChildForm("sendTextDetailsForm", this.sendTextDetailsForm);

    this.sendTextDetailsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.sendFormContainer.patchSend((send) => {
        return Object.assign(send, {
          name: value.name,
          text: { text: value.textToShare, hidden: value.hideTextByDefault },
          deletionDate: new Date(this.formattedDeletionDate),
          expirationDate: new Date(this.formattedDeletionDate),
        } as SendView);
      });
    });
  }

  async ngOnInit() {
    this.setupDeletionDatePresets();

    if (this.originalSendView) {
      this.sendTextDetailsForm.patchValue({
        name: this.originalSendView.name,
        textToShare: this.originalSendView.text.text,
        hideTextByDefault: this.originalSendView.text.hidden,
        selectedDeletionDatePreset: this.originalSendView.deletionDate.toString(),
      });

      // If existing deletion date exists, calculate it once and store it
      if (this.originalSendView.deletionDate) {
        this.customDeletionDateOption = {
          name: this.datePipe.transform(this.originalSendView.deletionDate, "MM/dd/yyyy, hh:mm a"),
          value: this.originalSendView.deletionDate.toString(),
        };
        this.datePresetOptions.unshift(this.customDeletionDateOption);
      }
    }
  }

  setupDeletionDatePresets() {
    const defaultSelections: DatePresetSelectOption[] = [
      { name: this.i18nService.t("oneHour"), value: DatePreset.OneHour },
      { name: this.i18nService.t("oneDay"), value: DatePreset.OneDay },
      { name: this.i18nService.t("days", "2"), value: DatePreset.TwoDays },
      { name: this.i18nService.t("days", "3"), value: DatePreset.ThreeDays },
      { name: this.i18nService.t("days", "7"), value: DatePreset.SevenDays },
      { name: this.i18nService.t("days", "14"), value: DatePreset.FourteenDays },
      { name: this.i18nService.t("days", "30"), value: DatePreset.ThirtyDays },
    ];

    this.datePresetOptions = defaultSelections;
  }

  get formattedDeletionDate(): string {
    const now = new Date();
    const selectedValue = this.sendTextDetailsForm.controls.selectedDeletionDatePreset.value;

    // If existing deletion date is selected, return it as is
    if (typeof selectedValue === "string") {
      return selectedValue;
    }

    const milliseconds = now.setTime(now.getTime() + (selectedValue as number) * 60 * 60 * 1000);
    return new Date(milliseconds).toString();
  }
}
