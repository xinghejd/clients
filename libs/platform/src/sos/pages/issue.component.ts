import { Component, EventEmitter, Output } from "@angular/core";

import { ItemModule, TypographyModule } from "@bitwarden/components";

@Component({
  selector: "bit-sos-page-issue",
  templateUrl: "./issue.component.html",
  standalone: true,
  imports: [TypographyModule, ItemModule],
})
export class IssuePageComponent {
  @Output()
  selected = new EventEmitter();

  select(page: string) {
    this.selected.emit({ page: "external-site" });
  }
}
