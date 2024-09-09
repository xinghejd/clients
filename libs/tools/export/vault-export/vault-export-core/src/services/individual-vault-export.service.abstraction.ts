import { ExportFormat } from "./vault-export.service.abstraction";

export abstract class IndividualVaultExportServiceAbstraction {
  getExport: (format: ExportFormat) => Promise<string | Uint8Array>;
  getPasswordProtectedExport: (
    format: ExportFormat,
    password: string,
  ) => Promise<string | Uint8Array>;
}
