import { Component, HostBinding, Input } from "@angular/core";

export type SectionVariant = "default" | "two-col";

const Styling: Record<SectionVariant, string[]> = {
  default: ["tw-max-w-xl"],
  "two-col": ["tw-max-w-3xl"],
};

@Component({
  selector: "bit-section",
  template: "<ng-content></ng-content>",
  standalone: true,
})
export class SectionComponent {
  @Input() variant: SectionVariant = "default";

  @HostBinding("class")
  get classList(): string[] {
    return ["tw-block", "tw-mb-16"].concat(Styling[this.variant]);
  }
}
