import { Component } from "@angular/core";

import { TypographyModule } from "@bitwarden/components";

@Component({
  selector: "bit-sos-page-first",
  templateUrl: "./first.component.html",
  standalone: true,
  imports: [TypographyModule],
})
export class FirstPageComponent {}
