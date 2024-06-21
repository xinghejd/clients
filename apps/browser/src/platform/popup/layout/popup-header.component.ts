import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { IconButtonModule, TypographyModule } from "@bitwarden/components";

import { PopupHistoryService } from "../view-cache/popup-history.service";

@Component({
  selector: "popup-header",
  templateUrl: "popup-header.component.html",
  standalone: true,
  imports: [TypographyModule, CommonModule, IconButtonModule, JslibModule],
})
export class PopupHeaderComponent {
  private popupHistoryService = inject(PopupHistoryService);

  /** Display the back button, which uses Location.back() to go back one page in history */
  @Input()
  get showBackButton() {
    return this._showBackButton;
  }
  set showBackButton(value: BooleanInput) {
    this._showBackButton = coerceBooleanProperty(value);
  }

  private _showBackButton = false;

  /** Title string that will be inserted as an h1 */
  @Input({ required: true }) pageTitle: string;

  async back() {
    return this.popupHistoryService.back();
  }
}
