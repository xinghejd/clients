import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

@Component({
  selector: "bit-spinner",
  templateUrl: "spinner.component.html",
  standalone: true,
  imports: [CommonModule],
})
export class SpinnerComponent {
  /**
   * The size of the spinner. Defaults to `large`.
   */
  @Input() size: "fill" | "small" | "large" = "large";

  private _noColor = false;
  /**
   * Disable the default color of the spinner, inherits the text color.
   */
  @Input()
  get noColor(): boolean {
    return this._noColor;
  }
  set noColor(value: boolean | "") {
    this._noColor = coerceBooleanProperty(value);
  }

  private _title = this.i18nService.t("loading");
  /**
   * Accessibility title. Defaults to `Loading`.
   */
  @Input()
  get title(): string {
    return this._title;
  }
  set title(value: string) {
    this.title = this.i18nService.t(value);
  }

  private _sr = true;
  /**
   * Display text for screen readers.
   */
  @Input()
  get sr(): boolean {
    return this._sr;
  }
  set sr(value: boolean | "") {
    this._sr = coerceBooleanProperty(value);
  }

  @HostBinding("class") get classList() {
    return ["tw-inline-block", "tw-overflow-hidden"]
      .concat(this.sizeClass)
      .concat([this._noColor ? null : "tw-text-primary-600"]);
  }

  constructor(private i18nService: I18nService) {}

  get sizeClass() {
    switch (this.size) {
      case "small":
        return ["tw-h-4"];
      case "large":
        return ["tw-h-16"];
      default:
        return ["tw-h-full", "tw-w-full"];
    }
  }
}
