import { Component } from "@angular/core";

import { ButtonModule, DialogModule } from "@bitwarden/components";

@Component({
  selector: "bit-sos-dialog",
  templateUrl: "./sos-dialog.component.html",
  standalone: true,
  imports: [DialogModule, ButtonModule],
})
export class SosDialogComponent {}
