import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { action } from "@storybook/addon-actions";
import { Meta, moduleMetadata } from "@storybook/angular";
import { timer } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { ButtonModule } from "../button";
import { FormFieldModule } from "../form-field";
import { IconButtonModule } from "../icon-button";
import { MenuModule } from "../menu";
import { I18nMockService } from "../utils/i18n-mock.service";

import { AsyncActionsModule } from "./async-actions.module";

export default {
  title: "Component Library/Async Actions",
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        AsyncActionsModule,
        ButtonModule,
        IconButtonModule,
        MenuModule,
        FormsModule,
        ReactiveFormsModule,
        FormFieldModule,
      ],
      providers: [
        {
          provide: ValidationService,
          useValue: {
            showError: action("ValidationService.showError"),
          } as Partial<ValidationService>,
        },
        {
          provide: LogService,
          useValue: {
            error: action("LogService.error"),
          } as Partial<LogService>,
        },
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              required: "required",
              inputRequired: "Input is required.",
              inputEmail: "Input is not an email-address.",
            });
          },
        },
      ],
    }),
  ],
} as Meta;

export const SingleStandalone = {
  render: (args: unknown) => ({
    template: `
      <button bitButton buttonType="primary" [bitAction]="handler">
        Perform action
      </button>`,
    props: {
      handler: () => timer(2000),
    },
  }),
};

export const MultipleStandalone = {
  render: (args: unknown) => ({
    template: `
      <button class="tw-mr-2" bitButton buttonType="primary" [bitAction]="handler">
        First action
      </button>
      <button class="tw-mr-2" bitButton buttonType="secondary" [bitAction]="handler">
        Second action
      </button>
      <button class="tw-mr-2" buttonType="danger" bitIconButton="bwi-trash" [bitAction]="handler"></button>`,
    props: {
      handler: () => timer(2000),
    },
  }),
};

export const GroupedWithContext = {
  render: (args: unknown) => ({
    template: `
      <button class="tw-mr-2" bitButton buttonType="primary" [bitAction]="handler" context="group-with-context">
        Accept
      </button>
      <button class="tw-mr-2" bitButton buttonType="danger" [bitAction]="handler" context="group-with-context">
        Reject
      </button>`,
    props: {
      handler: () => timer(2000),
    },
  }),
};

export const GroupedInMenu = {
  render: (args: unknown) => ({
    template: `
      <div class="tw-h-40">
        <button bitButton buttonType="secondary" [bitMenuTriggerFor]="groupMenu">Open menu</button>
      </div>

      <bit-menu #groupMenu>
        <button type="button" bitMenuItem [bitAction]="handler" context="grouped-in-menu">
          <i class="bwi bwi-fw bwi-check tw-mr-2" aria-hidden="true"></i>Accept
        </button>
        <button type="button" bitMenuItem [bitAction]="handler" context="grouped-in-menu">
          <i class="bwi bwi-fw bwi-close tw-mr-2" aria-hidden="true"></i>Reject
        </button>
      </bit-menu>`,
    props: {
      handler: () => timer(2000),
    },
  }),
};

const formObj = new FormBuilder().group({
  name: ["", [Validators.required]],
  email: ["", [Validators.required, Validators.email]],
});
export const Form = {
  render: (args: unknown) => ({
    template: `
      <form [formGroup]="formObj" [bitSubmit]="submit">
        <bit-form-field>
          <bit-label>Name</bit-label>
          <input bitInput formControlName="name" />
        </bit-form-field>

        <bit-form-field>
          <bit-label>Email</bit-label>
          <input bitInput formControlName="email" />
          <button type="button" bitSuffix bitIconButton="bwi-refresh" bitFormButton [bitAction]="refresh"></button>
        </bit-form-field>

        <button class="tw-mr-2" type="submit" buttonType="primary" bitButton bitFormButton>Submit</button>
        <button class="tw-mr-2" type="button" buttonType="secondary" bitButton bitFormButton>Cancel</button>
        <button class="tw-mr-2" type="button" buttonType="danger" bitButton bitFormButton [bitAction]="handler">Delete</button>
        <button class="tw-mr-2" type="button" buttonType="secondary" bitIconButton="bwi-star" bitFormButton [bitAction]="handler">Delete</button>
      </form>`,
    props: {
      submit: () => {
        formObj.markAllAsTouched();

        if (!formObj.valid) {
          return undefined;
        }

        return timer(2000);
      },
      handler: () => timer(2000),
      formObj,
    },
  }),
};
