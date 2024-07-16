import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { ButtonModule, DialogModule } from "@bitwarden/components";

import { FirstPageComponent } from "./pages/first.component";

type State = { title: string } & {
  page: "first";
};

@Component({
  selector: "bit-sos-dialog",
  templateUrl: "./sos-dialog.component.html",
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, FirstPageComponent],
})
export class SosDialogComponent {
  protected state: State = { page: "first", title: "Introduction" };
  // protected get state() {
  //   return this._state;
  // }

  // ngOnInit(): void {

  // }
}
