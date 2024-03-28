import { CREEPImporter } from "../src/importers";

import { CREEPResponse } from "./test-data/cef/creep-response";

describe("CREEP (Credential Exchange Protocol) Importer", () => {
  it("should parse login data", async () => {
    const importer = new CREEPImporter();
    const result = await importer.parse(CREEPResponse);
    expect(result != null).toBe(true);
  });

  it("should unzip login data", async () => {
    const importer = new CREEPImporter();
    const result = await importer.extractZipContent(
      "5rG0AADgrIDxubCgbAAAFfCQk7UA7YyO4ZSA0JTDnWwAAAsAw63wkJO1AAAAAAAA5I2F0JRQ8oCBtQDCpPGBkIDlgYvMgO2MhAA",
      "index.json",
    );
    expect(result != null).toBe(true);
  });
});
