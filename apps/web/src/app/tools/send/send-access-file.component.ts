import { Component, Input, OnInit } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncArrayBuffer } from "@bitwarden/common/platform/models/domain/enc-array-buffer";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { SendAccessRequest } from "@bitwarden/common/tools/send/models/request/send-access.request";
import { SendAccessView } from "@bitwarden/common/tools/send/models/view/send-access.view";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { ToastService } from "@bitwarden/components";

import { SharedModule } from "../../shared";

@Component({
  selector: "app-send-access-file",
  templateUrl: "send-access-file.component.html",
  imports: [SharedModule],
  standalone: true,
})
export class SendAccessFileComponent implements OnInit {
  @Input() send: SendAccessView;
  @Input() decKey: SymmetricCryptoKey;
  @Input() accessRequest: SendAccessRequest;

  imageFileExtensions = ["jpg", "jpeg", "png", "avif"];
  imageMimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    avif: "image/avif",
  };
  maxPreviewFileSize = 1024 * 1024 * 10; // 10MiB
  imageUrl: SafeUrl = null;

  constructor(
    private i18nService: I18nService,
    private toastService: ToastService,
    private cryptoService: CryptoService,
    private fileDownloadService: FileDownloadService,
    private sendApiService: SendApiService,
    private sanitizer: DomSanitizer,
  ) {}

  async ngOnInit() {
    if (
      Number(this.send.file.size) < this.maxPreviewFileSize &&
      this.imageFileExtensions.includes(this.getFileExtention(this.send.file.fileName))
    ) {
      const decBuffer = await this.downloadToBuffer();
      if (decBuffer != null) {
        const decBufferB64 = Utils.fromBufferToB64(decBuffer);
        const mimeType =
          this.imageMimeTypes[
            this.getFileExtention(this.send.file.fileName) as "jpg" | "jpeg" | "png" | "avif"
          ];
        this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(
          `data:${mimeType};base64,` + decBufferB64,
        );
      }
    }
  }

  private getFileExtention(filename: string): string {
    const splitFileName = filename.split(".");
    if (splitFileName.length > 1) {
      return splitFileName[splitFileName.length - 1];
    }
    return "";
  }

  protected downloadToBuffer = async () => {
    if (this.send == null || this.decKey == null) {
      return;
    }

    const downloadData = await this.sendApiService.getSendFileDownloadData(
      this.send,
      this.accessRequest,
    );

    if (Utils.isNullOrWhitespace(downloadData.url)) {
      this.toastService.showToast({
        variant: "error",
        title: null,
        message: this.i18nService.t("missingSendFile"),
      });
      return;
    }

    const response = await fetch(new Request(downloadData.url, { cache: "no-store" }));
    if (response.status !== 200) {
      this.toastService.showToast({
        variant: "error",
        title: null,
        message: this.i18nService.t("errorOccurred"),
      });
      return;
    }

    try {
      const encBuf = await EncArrayBuffer.fromResponse(response);
      const decBuf = await this.cryptoService.decryptFromBytes(encBuf, this.decKey);
      return decBuf;
    } catch (e) {
      this.toastService.showToast({
        variant: "error",
        title: null,
        message: this.i18nService.t("errorOccurred"),
      });
    }
  };

  protected download = async () => {
    try {
      const decBuf = await this.downloadToBuffer();
      this.fileDownloadService.download({
        fileName: this.send.file.fileName,
        blobData: decBuf,
        downloadMethod: "save",
      });
    } catch (e) {
      this.toastService.showToast({
        variant: "error",
        title: null,
        message: this.i18nService.t("errorOccurred"),
      });
    }
  };
}
