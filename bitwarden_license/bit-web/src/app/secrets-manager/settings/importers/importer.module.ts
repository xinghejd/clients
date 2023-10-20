import { NgModule, Type } from "@angular/core";

import { AppSettingsJsonSecretsManagerImporter } from "./appsettings-json.importer";
import { BitwardenJsonSecretsManagerImporter } from "./bitwarden-json.importer";
import { SecretsManagerImporter } from "./importer.abstraction";

function simpleImporters<T extends SecretsManagerImporter>(...types: Type<T>[]) {
  return types.map((t) => ({ provide: SecretsManagerImporter, useClass: t, multi: true }));
}

@NgModule({
  providers: [
    simpleImporters(BitwardenJsonSecretsManagerImporter, AppSettingsJsonSecretsManagerImporter),
  ],
})
export class ImporterModule {}
