import { Meta, StoryObj } from "@storybook/angular";

import { SectionComponent } from "./section.component";

export default {
  title: "Component Library/Section",
  component: SectionComponent,
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=5115%3A26950",
    },
  },
} as Meta<SectionComponent>;

type Story = StoryObj<SectionComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-section>
        <div class="tw-bg-secondary-300 tw-p-5">
          Section
        </div>
      </bit-section>

      <bit-section>
        <div class="tw-bg-secondary-300 tw-p-5">
          Section
        </div>
      </bit-section>
    `,
  }),
};

export const TwoCol: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-section variant="two-col">
        <div class="tw-bg-secondary-300 tw-p-5">
          Left
        </div>
        <div class="tw-bg-primary-300 tw-p-5">
          Right
        </div>
      </bit-section>
    `,
  }),
};
