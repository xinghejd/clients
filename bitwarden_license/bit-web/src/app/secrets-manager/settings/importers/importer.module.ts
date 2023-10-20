import { NgModule, Type } from "@angular/core";

import { ProjectService } from "../../projects/project.service";

import { AppSettingsJsonSecretsManagerImporter } from "./appsettings-json.importer";
import { BitwardenJsonSecretsManagerImporter } from "./bitwarden-json.importer";
import { SecretsManagerImporter } from "./importer.abstraction";

function simpleImporters<T extends SecretsManagerImporter>(...types: Type<T>[]) {
  return types.map((t) => ({ provide: SecretsManagerImporter, useClass: t, multi: true }));
}

function depsImporter<T extends SecretsManagerImporter>(type: Type<T>, deps: unknown[]) {
  return { provide: SecretsManagerImporter, useClass: type, multi: true, deps: deps };
}

@NgModule({
  providers: [
    simpleImporters(BitwardenJsonSecretsManagerImporter),
    depsImporter(AppSettingsJsonSecretsManagerImporter, [ProjectService]),
  ],
})
export class ImporterModule {}
