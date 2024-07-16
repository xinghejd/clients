import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { I18nMockService } from "@bitwarden/components";

import { SosDialogComponent } from "./sos-dialog.component";

export default {
  title: "Platform/Sos Dialog",
  component: SosDialogComponent,
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [SosDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              close: "Close",
            });
          },
        },
      ],
    }),
  ],
} as Meta;

type Story = StoryObj<SosDialogComponent>;

export const Dialog: Story = {
  render: (args) => ({
    props: args,
  }),
};
