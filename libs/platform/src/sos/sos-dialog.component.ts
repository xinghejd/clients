import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { ButtonModule, DialogModule } from "@bitwarden/components";

import { AnalysisPageComponent } from "./pages/analysis.component";
import { ExternalSiteSelectPageComponent } from "./pages/external-site-select.component";
import { FirstPageComponent } from "./pages/first.component";
import { IssuePageComponent } from "./pages/issue.component";

const titles: Record<State["page"], string> = {
  first: "Introduction",
  issue: "Issue identification",
  "external-site-select": "Select external site",
  loading: "Processing...",
  analysis: "Result of breach analysis",
};

type State =
  | {
      page: "first";
    }
  | {
      page: "issue";
    }
  | {
      page: "external-site-select";
    }
  | {
      page: "loading";
    }
  | {
      page: "analysis";
    };

@Component({
  selector: "bit-sos-dialog",
  templateUrl: "./sos-dialog.component.html",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    FirstPageComponent,
    IssuePageComponent,
    ExternalSiteSelectPageComponent,
    AnalysisPageComponent,
  ],
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

  async loadAndGotoPage(page: State["page"]) {
    this.state = { page: "loading" };
    await new Promise((resolve) => setTimeout(resolve, 5000));
    this.state = { page };
  }
}
