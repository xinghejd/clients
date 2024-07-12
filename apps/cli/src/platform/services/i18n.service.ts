import * as fs from "fs";
import * as path from "path";

import { I18nService as BaseI18nService } from "@bitwarden/common/platform/services/i18n.service";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";

export class I18nService extends BaseI18nService {
  constructor(
    systemLanguage: string,
    localesDirectory: string,
    globalStateProvider: GlobalStateProvider,
  ) {
    super(
      systemLanguage,
      localesDirectory,
      (formattedLocale: string) => {
        const filePath = path.join(
          `${process.platform === "win32" ? "" : "/"}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]}`,
          this.localesDirectory + "/" + formattedLocale + "/messages.json",
        );
        const localesJson = fs.readFileSync(filePath, "utf8");
        const locales = JSON.parse(localesJson.replace(/^\uFEFF/, "")); // strip the BOM
        return Promise.resolve(locales);
      },
      globalStateProvider,
    );

    this.supportedTranslationLocales = ["en"];
  }
}
