import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { ImportOption } from "../importers/importer.abstraction";

@Component({
  selector: "sm-dynamic-import-option",
  templateUrl: "./sm-dynamic-import-option.component.html",
})
export class SecretsManagerDynamicImportOptionComponent {
  constructor(private i18nService: I18nService) {}

  @Input()
  option: ImportOption;

  @Input()
  form: FormGroup;

  get key(): string {
    return this.option.key.toString();
  }

  get label(): string {
    return typeof this.option.label === "string"
      ? this.option.label
      : this.i18nService.t(this.option.label.key);
  }
}
