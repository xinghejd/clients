import { Component, EventEmitter, Output } from "@angular/core";

import { ItemModule, TypographyModule } from "@bitwarden/components";

@Component({
  selector: "bit-sos-page-analysis",
  templateUrl: "./analysis.component.html",
  standalone: true,
  imports: [TypographyModule, ItemModule],
})
export class AnalysisPageComponent {
  @Output()
  selected = new EventEmitter();

  select(page: string) {
    this.selected.emit({ page: "external-site" });
  }
}
