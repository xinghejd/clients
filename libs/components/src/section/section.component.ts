import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

export type SectionVariant = "default" | "two-col";

const Styling: Record<SectionVariant, string[]> = {
  default: ["tw-max-w-xl", "tw-block"],
  "two-col": ["tw-max-w-3xl", "tw-grid", "tw-grid-cols-2", "tw-gap-12"],
};

@Component({
  selector: "bit-section",
  templateUrl: "section.component.html",
  imports: [CommonModule],
  standalone: true,
})
export class SectionComponent {
  @Input() variant: SectionVariant = "default";

  get classList(): string[] {
    return ["tw-mb-12"].concat(Styling[this.variant]);
  }
}
