import { CommonModule, Location } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Params } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { SendId } from "@bitwarden/common/types/guid";
import {
  AsyncActionsModule,
  ButtonModule,
  IconButtonModule,
  SearchModule,
} from "@bitwarden/components";
import {
  DefaultSendFormConfigService,
  SendAddEditService,
  SendAddEditServiceAbstraction,
  SendFormConfigService,
} from "@bitwarden/send-ui";

import { SendFormModule } from "../../../../../../../libs/tools/send/send-ui/src/send-form/send-form.module";
import { PopupFooterComponent } from "../../../../platform/popup/layout/popup-footer.component";
import { PopupHeaderComponent } from "../../../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../../../platform/popup/layout/popup-page.component";

/**
 * Helper class to parse query parameters for the AddEdit route.
 */
class QueryParams {
  constructor(params: Params) {
    this.sendId = params.sendId;
    this.type = parseInt(params.type, 10);
  }

  /**
   * The ID of the send to edit, empty when it's a new Send
   */
  sendId?: SendId;

  /**
   * The type of send to create.
   */
  type: SendType;
}

export type AddEditQueryParams = Partial<Record<keyof QueryParams, string>>;

/**
 * Component for adding or editing a send item.
 */
@Component({
  selector: "tools-send-add-edit",
  templateUrl: "send-add-edit.component.html",
  standalone: true,
  providers: [
    { provide: SendFormConfigService, useClass: DefaultSendFormConfigService },
    { provide: SendAddEditServiceAbstraction, useClass: SendAddEditService },
  ],
  imports: [
    CommonModule,
    SearchModule,
    JslibModule,
    FormsModule,
    ButtonModule,
    IconButtonModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopupFooterComponent,
    SendFormModule,
    AsyncActionsModule,
  ],
})
export class SendAddEditComponent {
  constructor(
    private location: Location,
    protected sendAddEditService: SendAddEditServiceAbstraction,
  ) {}

  deleteSend = async () => {
    if (await this.sendAddEditService.deleteSend()) {
      this.location.back();
    }
  };

  /**
   * Handles the event when the send is saved.
   */
  onSendSaved() {
    this.location.back();
  }
}
