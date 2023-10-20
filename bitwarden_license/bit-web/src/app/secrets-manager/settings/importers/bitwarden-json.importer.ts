import { ImportData, JsonSecretsManagerImporter } from "./importer.abstraction";

export class BitwardenJsonSecretsManagerImporter extends JsonSecretsManagerImporter {
  constructor() {
    super("bitwardenJson", "Bitwarden (json)");
  }

  override createImportDataParsed(
    data: unknown,
    _options: Record<symbol, string>
  ): Promise<ImportData> {
    return Promise.resolve(data as ImportData);
  }
}
