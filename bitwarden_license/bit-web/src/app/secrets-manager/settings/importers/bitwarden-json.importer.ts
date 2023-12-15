import { ImportData, JsonSecretsManagerImporter } from "./importer.abstraction";

export class BitwardenJsonSecretsManagerImporter extends JsonSecretsManagerImporter {
  constructor() {
    super(
      "bitwardenJson",
      "Bitwarden (json)",
      JSON.stringify(
        {
          projects: [
            {
              id: "92ab8d56-73c9-4e4f-8b47-b0a100f1ad0b",
              name: "Example Project",
            },
          ],
          secrets: [
            {
              key: "MySecret",
              value: "MyValue!",
              note: "",
              id: "6e590482-32a9-4e88-9960-466a4be2f105",
              projectIds: [],
            },
          ],
        },
        null,
        2,
      ),
    );
  }

  override createImportDataParsed(
    data: unknown,
    _options: Record<string, string>,
  ): Promise<ImportData> {
    return Promise.resolve(data as ImportData);
  }
}
