import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {
  Observable,
  Subject,
  combineLatest,
  concat,
  concatMap,
  firstValueFrom,
  map,
  of,
  takeUntil,
} from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { DialogService } from "@bitwarden/components";

import {
  SecretsManagerImportErrorDialogComponent,
  SecretsManagerImportErrorDialogOperation,
} from "../dialog/sm-import-error-dialog.component";
import { ImportOption, SecretsManagerImporter } from "../importers/importer.abstraction";
import { SecretsManagerImportError } from "../models/error/sm-import-error";
import { SecretsManagerPortingApiService } from "../services/sm-porting-api.service";

type ImportForm = {
  selectedImporter: FormControl<string>;
  importerOptions: FormGroup<Record<string, FormControl<string>>>;
  pastedContents: FormControl<string>;
};

@Component({
  selector: "sm-import",
  templateUrl: "./sm-import.component.html",
})
export class SecretsManagerImportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private organizationId$: Observable<string>;
  protected selectedFile: File;

  protected formGroup: FormGroup<ImportForm>;

  selectableImporters = this.importers.map((i) => ({
    label:
      typeof i.displayInfo === "string" ? i.displayInfo : this.i18nService.t(i.displayInfo.key),
    value: i.id,
  }));
  selectedImporter$: Observable<SecretsManagerImporter>;
  selectedImporterOptions$: Observable<ImportOption[]>;

  constructor(
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private platformUtilsService: PlatformUtilsService,
    protected fileDownloadService: FileDownloadService,
    private logService: LogService,
    private secretsManagerPortingApiService: SecretsManagerPortingApiService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    @Inject(SecretsManagerImporter) private importers: SecretsManagerImporter[],
  ) {
    this.formGroup = this.fb.group({
      selectedImporter: this.fb.control(""),
      importerOptions: this.fb.group({}),
      pastedContents: this.fb.control(""),
    });
  }

  async ngOnInit() {
    this.organizationId$ = this.route.params
      .pipe(takeUntil(this.destroy$))
      .pipe(map((params) => params.organizationId));

    const defaultImporter = this.importers[0];

    this.selectedImporter$ = concat(
      of(defaultImporter),
      this.formGroup.controls.selectedImporter.valueChanges.pipe(
        map((importerId) => this.importers.find((i) => i.id === importerId) ?? defaultImporter),
      ),
    );

    this.formGroup.controls.selectedImporter.setValue(defaultImporter.id);

    this.selectedImporterOptions$ = combineLatest([
      this.selectedImporter$,
      this.organizationId$,
    ]).pipe(
      concatMap(async ([importer, organizationId]) => {
        const options = await importer.buildOptions(organizationId);
        const importerOptionsGroup = this.fb.group(
          options.reduce(
            (agg, option) => {
              agg[option.key] = this.fb.control(option.value);
              return agg;
            },
            {} as Record<string, FormControl<string>>,
          ),
        );
        this.formGroup.controls.importerOptions = importerOptionsGroup;
        return options;
      }),
    );
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit = async () => {
    const fileElement = document.getElementById("file") as HTMLInputElement;
    const importContents = await this.getImportContents(
      fileElement,
      this.formGroup.get("pastedContents").value.trim(),
    );

    if (importContents == null) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("selectFile"),
      );
      return;
    }

    const importer = this.importers.find(
      (i) => i.id === this.formGroup.controls.selectedImporter.value,
    );

    if (importer == null) {
      this.logService.warning("Invalid importer selection");
      return;
    }

    try {
      const importData = await importer.createImportData(
        importContents,
        this.formGroup.controls.importerOptions.value,
      );

      const organizationId = await firstValueFrom(this.organizationId$);

      const error = await this.secretsManagerPortingApiService.import(organizationId, importData);

      if (error?.lines?.length > 0) {
        this.openImportErrorDialog(error);
        return;
      } else if (!Utils.isNullOrWhitespace(error?.message)) {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("errorOccurred"),
          error.message,
        );
        return;
      } else if (error != null) {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("errorOccurred"),
          this.i18nService.t("errorReadingImportFile"),
        );
        return;
      }

      this.platformUtilsService.showToast("success", null, this.i18nService.t("importSuccess"));
      this.clearForm();
    } catch (error) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("errorReadingImportFile"),
      );
      this.logService.error(error);
    }
  };

  protected async getImportContents(
    fileElement: HTMLInputElement,
    pastedContents: string,
  ): Promise<string> {
    const files = fileElement.files;

    if (
      (files == null || files.length === 0) &&
      (pastedContents == null || pastedContents === "")
    ) {
      return null;
    }

    let fileContents = pastedContents;
    if (files != null && files.length > 0) {
      try {
        const content = await this.getFileContents(files[0]);
        if (content != null) {
          fileContents = content;
        }
      } catch (e) {
        this.logService.error(e);
      }
    }

    if (fileContents == null || fileContents === "") {
      return null;
    }

    return fileContents;
  }

  protected setSelectedFile(event: Event) {
    const fileInputEl = <HTMLInputElement>event.target;
    const file = fileInputEl.files.length > 0 ? fileInputEl.files[0] : null;
    this.selectedFile = file;
  }

  private clearForm() {
    (document.getElementById("file") as HTMLInputElement).value = "";
    this.selectedFile = null;
    this.formGroup.reset({
      pastedContents: "",
    });
  }

  private getFileContents(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, "utf-8");
      reader.onload = (evt) => {
        resolve((evt.target as any).result);
      };
      reader.onerror = () => {
        reject();
      };
    });
  }

  private openImportErrorDialog(error: SecretsManagerImportError) {
    this.dialogService.open<unknown, SecretsManagerImportErrorDialogOperation>(
      SecretsManagerImportErrorDialogComponent,
      {
        data: {
          error: error,
        },
      },
    );
  }
}
