export type ImportData = {
  projects: { id: string; name: string }[];
  secrets: { id?: string; key: string; value: string; note?: string; projectIds: string[] }[];
};

export type Translation = {
  key: string;
  args?: (string | number)[];
};

export class ImportOption {
  value: string | undefined;
  key: symbol;
  label: string | Translation;
  required: boolean;
  type: "textbox" | "dropdown";
  options: { key: string; value: string }[];

  constructor(options: {
    value?: string;
    key: symbol;
    label: string | Translation;
    required?: boolean;
    type?: "textbox" | "dropdown";
    options?: { key: string; value: string }[];
  }) {
    this.value = options.value;
    this.key = options.key;
    this.label = options.label;
    this.required = options.required || false;
    this.type = options.type || "textbox";
    this.options = options.options || [];
  }
}

export abstract class SecretsManagerImporter {
  constructor(
    readonly id: string,
    readonly displayInfo: string | Translation,
    readonly accept: string,
    readonly placeholder: string = ""
  ) {}
  buildOptions(organizationId: string): Promise<ImportOption[]> {
    return Promise.resolve([]);
  }
  abstract createImportData(data: string, options: Record<symbol, string>): Promise<ImportData>;
}

export abstract class JsonSecretsManagerImporter extends SecretsManagerImporter {
  constructor(id: string, displayInfo: string | Translation) {
    super(id, displayInfo, "application/JSON");
  }

  abstract createImportDataParsed(
    data: unknown,
    options: Record<symbol, string>
  ): Promise<ImportData>;

  override createImportData(data: string, options: Record<symbol, string>): Promise<ImportData> {
    return this.createImportDataParsed(JSON.parse(data), options);
  }
}
