import { Component, EventEmitter, Output } from "@angular/core";

import { ItemModule, TypographyModule } from "@bitwarden/components";

@Component({
  selector: "bit-sos-page-external-site-select",
  templateUrl: "./external-site-select.component.html",
  standalone: true,
  imports: [TypographyModule, ItemModule],
})
export class ExternalSiteSelectPageComponent {
  @Output()
  selected = new EventEmitter();

  select() {
    this.selected.emit();
  }
}
