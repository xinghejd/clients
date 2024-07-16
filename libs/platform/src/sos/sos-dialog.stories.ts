import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { SosDialogComponent } from "./sos-dialog.component";

export default {
  title: "Platform/Sos Dialog",
  component: SosDialogComponent,
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [SosDialogComponent],
    }),
  ],
} as Meta;

type Story = StoryObj<SosDialogComponent>;

export const Dialog: Story = {
  render: (args) => ({
    props: args,
  }),
};
