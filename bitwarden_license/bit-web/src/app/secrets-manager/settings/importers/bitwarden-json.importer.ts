import { ImportData, JsonSecretsManagerImporter } from "./importer.abstraction";

export class BitwardenJsonSecretsManagerImporter extends JsonSecretsManagerImporter {
  constructor() {
    super(
      "bitwardenJson",
      "Bitwarden (json)",
      JSON.stringify(
        {
          something: true,
        },
        null,
        2
      )
    );
  }

  override createImportDataParsed(
    data: unknown,
    _options: Record<string, string>
  ): Promise<ImportData> {
    return Promise.resolve(data as ImportData);
  }
}
