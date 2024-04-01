import * as JSZip from "jszip";

import { ImportResult } from "../../models/import-result";

import { CEFImporter } from "./cef-importer";
import { CREEPResponse } from "./types/creep-reponse";

// Taken from JSZip
interface InputByType {
  base64: string;
  string: string;
  text: string;
  binarystring: string;
  array: number[];
  uint8array: Uint8Array;
  arraybuffer: ArrayBuffer;
  blob: Blob;
  stream: NodeJS.ReadableStream;
}
type InputFileFormat = InputByType[keyof InputByType] | Promise<InputByType[keyof InputByType]>;

export class CREEPImporter extends CEFImporter {
  async parse(data: string): Promise<ImportResult> {
    const response: CREEPResponse = JSON.parse(data);

    //TODO HPKE decryption

    // Pass base64 encoded payload (zip) over to extractZipContent
    const contentString = await this.extractZipContent(response.payload, "index.json");
    return super.parse(contentString);
  }

  async extractZipContent(container: InputFileFormat, contentFilePath: string): Promise<string> {
    // Per the CREEP spec the payload is provided as abase64 encoded string
    const zipOptions: JSZip.JSZipLoadOptions = { base64: true };

    return new JSZip()
      .loadAsync(container, zipOptions)
      .then((zip) => {
        return zip.files["index.jwe"].async("string");
      })
      .then(
        function success(content) {
          return content;
        },
        function error(e) {
          return "";
        },
      );
  }
}
