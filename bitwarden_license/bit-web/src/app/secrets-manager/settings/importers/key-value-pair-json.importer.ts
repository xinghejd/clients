import { ProjectService } from "../../projects/project.service";

import { ImportData, ImportOption, JsonSecretsManagerImporter } from "./importer.abstraction";

export class KeyValuePairJsonSecretsManagerImporter extends JsonSecretsManagerImporter {
  static readonly SeperatorKey = Symbol("seperator");
  static readonly ProjectKey = Symbol("project");

  constructor(private projectService: ProjectService) {
    super("keyValuePairJson", "Key Value Pair Json");
  }

  async buildOptions(organizationId: string): Promise<ImportOption[]> {
    const projects = await this.projectService.getProjects(organizationId);
    const options = projects.map((p) => ({ key: p.id, value: p.name }));
    options.unshift({ key: "", value: "-- None --" });
    const projectOption = new ImportOption({
      key: KeyValuePairJsonSecretsManagerImporter.ProjectKey,
      label: "Project",
      value: null,
      type: "dropdown",
      options: options,
    });

    const seperatorOption = new ImportOption({
      key: KeyValuePairJsonSecretsManagerImporter.SeperatorKey,
      label: "Key Seperator",
      value: ":",
      type: "textbox",
    });

    return [projectOption, seperatorOption];
  }

  createImportDataParsed(data: unknown, options: Record<symbol, string>): Promise<ImportData> {
    const seperator = options[KeyValuePairJsonSecretsManagerImporter.SeperatorKey] || ":";
    const parser = new Parser(seperator);
    const parsedData = parser.parse(data);

    const projectId = options[KeyValuePairJsonSecretsManagerImporter.ProjectKey] || null;

    const projectIdsArray = projectId != null && projectId != "" ? [projectId] : [];

    return Promise.resolve({
      secrets: Object.entries(parsedData).map(([key, value]) => ({
        key: key,
        value: value || "",
        note: "",
        projectIds: projectIdsArray,
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
      this.paths.length > 0 ? this.paths[this.paths.length - 1] + this.seperator + context : context
    );
  }

  private exitContext() {
    this.paths.pop();
  }
}
