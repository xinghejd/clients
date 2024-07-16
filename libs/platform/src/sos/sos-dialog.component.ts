import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { ButtonModule, DialogModule } from "@bitwarden/components";

import { FirstPageComponent } from "./pages/first.component";
import { IssuePageComponent } from "./pages/issue.component";

const titles: Record<State["page"], string> = {
  first: "Introduction",
  issue: "Issue identification",
};

type State =
  | {
      page: "first";
    }
  | {
      page: "issue";
    };

@Component({
  selector: "bit-sos-dialog",
  templateUrl: "./sos-dialog.component.html",
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, FirstPageComponent, IssuePageComponent],
})
export class SosDialogComponent {
  protected state: State = { page: "first" };

  protected get title() {
    return titles[this.state.page];
  }

  next() {
    this.state = { page: "issue" };
  }

  goto(state: State) {
    this.state = state;
  }
}
