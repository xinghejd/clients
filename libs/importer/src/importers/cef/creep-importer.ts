import * as JSZip from "jszip";

import { Utils } from "@bitwarden/common/platform/misc/utils";

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

    // We use our own utils for decoding b64 since JSZip does not handle base64 without padding
    const d = Utils.fromB64ToArray(response.payload);

    const contentString = await this.extractZipContent(d, "index.jwe");

    return super.parse(contentString);
  }

  async extractZipContent(container: InputFileFormat, contentFilePath: string): Promise<string> {
    // Per the CREEP spec the payload is provided as abase64 encoded string

    return new JSZip()
      .loadAsync(container)
      .then((zip) => {
        return zip.files[contentFilePath].async("string");
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
