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

    // We use our own utils for decoding b64 since JSZip does not handle base64 without padding
    const d = Utils.fromUrlB64ToArray(response.payload);

    const contentString = await this.extractZipContent(d, "index.jwe", response.hpke);

    return super.parse(contentString);
  }

  async extractZipContent(
    container: InputFileFormat,
    contentFilePath: string,
    hpke: any,
  ): Promise<string> {
    const secretKey = await (window as any).suite.kem.importKey("jwk", hpke.key, true);
    const rawSecret = await (window as any).suite.kem.serializePublicKey(secretKey);

    return new JSZip()
      .loadAsync(container)
      .then((zip) => {
        return zip.files[contentFilePath].async("arraybuffer");
      })
      .then(async (content) => {
        const decrypted = await (window as any).suite.open(
          { recipientKey: (window as any).rkp, enc: rawSecret },
          content,
        );
        return Utils.fromBufferToUtf8(decrypted);
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
