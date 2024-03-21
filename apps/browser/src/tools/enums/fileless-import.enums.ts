const FilelessImportType = {
  LP: "LP",
  CREEP: "CREEP",
} as const;

type FilelessImportTypeKeys = (typeof FilelessImportType)[keyof typeof FilelessImportType];

const FilelessImportPort = {
  NotificationBar: "fileless-importer-notification-bar",
  LpImporter: "lp-fileless-importer",
  CREEPImporter: "creep-fileless-importer",
} as const;

export { FilelessImportType, FilelessImportTypeKeys, FilelessImportPort };
