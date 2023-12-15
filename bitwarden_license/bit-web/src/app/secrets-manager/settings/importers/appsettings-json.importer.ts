import { ImportData, ImportOption, JsonSecretsManagerImporter } from "./importer.abstraction";

export class AppSettingsJsonSecretsManagerImporter extends JsonSecretsManagerImporter {
  static readonly SeperatorKey = "seperator";

  constructor() {
    super(
      "appsettingsJson",
      "App Settings (json)",
      JSON.stringify(
        {
          key1: {
            key2: "my_config_value",
          },
          key3: true,
        },
        null,
        2,
      ),
    );
  }

  buildOptions(organizationId: string): Promise<ImportOption[]> {
    const seperatorOption = new ImportOption({
      key: AppSettingsJsonSecretsManagerImporter.SeperatorKey,
      label: { key: "keySeparator" },
      value: ":",
      type: "textbox",
    });

    return Promise.resolve([seperatorOption]);
  }

  createImportDataParsed(data: unknown, options: Record<string, string>): Promise<ImportData> {
    const seperator = options[AppSettingsJsonSecretsManagerImporter.SeperatorKey] || ":";
    const parser = new Parser(seperator);
    const parsedData = parser.parse(data);

    return Promise.resolve({
      secrets: Object.entries(parsedData).map(([key, value]) => ({
        key: key,
        value: value || "",
        note: "",
        projectIds: [],
      })),
      projects: [],
    });
  }
}

class Parser {
  private data: Record<string, string | null> = {};
  private paths: string[] = [];

  constructor(private seperator: string) {}

  parse(input: unknown): Record<string, string | null> {
    if (typeof input !== "object") {
      throw new Error("Top level json should be an object.");
    }

    this.visitObjectElement(input);

    return this.data;
  }

  private visitObjectElement(element: object) {
    let isEmpty = true;
    for (const [key, value] of Object.entries(element)) {
      isEmpty = false;
      this.enterContext(key);
      this.visitValue(value);
      this.exitContext();
    }
    this.setNullIfElementIsEmpty(isEmpty);
  }

  private visitArrayElement(element: unknown[]) {
    let i = 0;
    for (; i < element.length; i++) {
      this.enterContext(i.toString());
      this.visitValue(element[i]);
      this.exitContext();
    }
    this.setNullIfElementIsEmpty(i == 0);
  }

  private visitValue(value: unknown) {
    if (typeof value === "object" && value != null) {
      this.visitObjectElement(value);
    } else if (Array.isArray(value)) {
      this.visitArrayElement(value);
    } else if (typeof value !== "function") {
      // This should be what we consider a value
      const key = this.paths[this.paths.length - 1];
      if (value == null) {
        this.data[key] = null;
      } else {
        this.data[key] = String(value);
      }
    } else {
      throw new Error(`Unable to convert type ${typeof value} to a string value.`);
    }
  }

  private setNullIfElementIsEmpty(isEmpty: boolean) {
    if (isEmpty && this.paths.length > 0) {
      this.data[this.paths[this.paths.length - 1]] = null;
    }
  }

  private enterContext(context: string) {
    this.paths.push(
      this.paths.length > 0
        ? this.paths[this.paths.length - 1] + this.seperator + context
        : context,
    );
  }

  private exitContext() {
    this.paths.pop();
  }
}
