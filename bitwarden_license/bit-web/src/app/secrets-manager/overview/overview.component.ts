import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  map,
  Observable,
  switchMap,
  Subject,
  takeUntil,
  combineLatest,
  startWith,
  distinctUntilChanged,
  take,
  share,
  concatMap,
} from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";

import { OrganizationCounts } from "../models/view/counts.view";
import { ProjectListView } from "../models/view/project-list.view";
import { SecretListView } from "../models/view/secret-list.view";
import {
  ProjectDeleteDialogComponent,
  ProjectDeleteOperation,
} from "../projects/dialog/project-delete-dialog.component";
import {
  ProjectDialogComponent,
  ProjectOperation,
} from "../projects/dialog/project-dialog.component";
import { ProjectService } from "../projects/project.service";
import {
  SecretDeleteDialogComponent,
  SecretDeleteOperation,
} from "../secrets/dialog/secret-delete.component";
import {
  OperationType,
  SecretDialogComponent,
  SecretOperation,
} from "../secrets/dialog/secret-dialog.component";
import {
  SecretViewDialogComponent,
  SecretViewDialogParams,
} from "../secrets/dialog/secret-view-dialog.component";
import { SecretService } from "../secrets/secret.service";
import {
  ServiceAccountDialogComponent,
  ServiceAccountOperation,
} from "../service-accounts/dialog/service-account-dialog.component";
import { CountService } from "../shared/counts/count.service";
import { SecretsListComponent } from "../shared/secrets-list.component";

@Component({
  selector: "sm-overview",
  templateUrl: "./overview.component.html",
})
export class OverviewComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  private tableSize = 10;
  private organizationId: string;
  protected organizationName: string;
  protected userIsAdmin: boolean;
  protected loading = true;
  protected organizationEnabled = false;

  protected view$: Observable<{
    allProjects: ProjectListView[];
    allSecrets: SecretListView[];
    latestProjects: ProjectListView[];
    latestSecrets: SecretListView[];
    counts: OrganizationCounts;
  }>;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private countService: CountService,
    private secretService: SecretService,
    private dialogService: DialogService,
    private organizationService: OrganizationService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private logService: LogService,
  ) {}

  ngOnInit() {
    const orgId$ = this.route.params.pipe(
      map((p) => p.organizationId),
      distinctUntilChanged(),
    );

    orgId$
      .pipe(
        concatMap(async (orgId) => await this.organizationService.get(orgId)),
        takeUntil(this.destroy$),
      )
      .subscribe((org) => {
        this.organizationId = org.id;
        this.organizationName = org.name;
        this.userIsAdmin = org.isAdmin;
        this.loading = true;
        this.organizationEnabled = org.enabled;
      });

    const projects$ = combineLatest([
      orgId$,
      this.projectService.project$.pipe(startWith(null)),
    ]).pipe(
      switchMap(([orgId]) => this.projectService.getProjects(orgId)),
      share(),
    );

    const secrets$ = combineLatest([
      orgId$,
      this.secretService.secret$.pipe(startWith(null)),
      this.projectService.project$.pipe(startWith(null)),
    ]).pipe(
      switchMap(([orgId]) => this.secretService.getSecrets(orgId)),
      share(),
    );

    const counts$ = combineLatest([
      orgId$,
      this.secretService.secret$.pipe(startWith(null)),
      this.projectService.project$.pipe(startWith(null)),
    ]).pipe(
      switchMap(([orgId]) => this.countService.getOrganizationCounts(orgId)),
      share(),
    );

    this.view$ = orgId$.pipe(
      switchMap(() =>
        combineLatest([projects$, secrets$, counts$]).pipe(
          switchMap(async ([projects, secrets, counts]) => ({
            latestProjects: this.getRecentItems(projects, this.tableSize),
            latestSecrets: this.getRecentItems(secrets, this.tableSize),
            allProjects: projects,
            allSecrets: secrets,
            counts: {
              projects: counts.projects,
              secrets: counts.secrets,
            },
          })),
        ),
      ),
    );

    orgId$
      .pipe(
        switchMap(() => this.view$.pipe(take(1))),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getRecentItems<T extends { revisionDate: string }[]>(items: T, length: number): T {
    return items
      .sort((a, b) => {
        return new Date(b.revisionDate).getTime() - new Date(a.revisionDate).getTime();
      })
      .slice(0, length) as T;
  }

  // Projects ---

  openEditProject(projectId: string) {
    this.dialogService.open<unknown, ProjectOperation>(ProjectDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Edit,
        organizationEnabled: this.organizationEnabled,
        projectId: projectId,
      },
    });
  }

  openNewProjectDialog() {
    this.dialogService.open<unknown, ProjectOperation>(ProjectDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  openServiceAccountDialog() {
    this.dialogService.open<unknown, ServiceAccountOperation>(ServiceAccountDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  openDeleteProjectDialog(event: ProjectListView[]) {
    this.dialogService.open<unknown, ProjectDeleteOperation>(ProjectDeleteDialogComponent, {
      data: {
        projects: event,
      },
    });
  }

  // Secrets ---

  openSecretDialog() {
    this.dialogService.open<unknown, SecretOperation>(SecretDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  openEditSecret(secretId: string) {
    this.dialogService.open<unknown, SecretOperation>(SecretDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Edit,
        secretId: secretId,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  openViewSecret(secretId: string) {
    this.dialogService.open<unknown, SecretViewDialogParams>(SecretViewDialogComponent, {
      data: {
        organizationId: this.organizationId,
        secretId: secretId,
      },
    });
  }

  openDeleteSecret(event: SecretListView[]) {
    this.dialogService.open<unknown, SecretDeleteOperation>(SecretDeleteDialogComponent, {
      data: {
        secrets: event,
      },
    });
  }

  openNewSecretDialog() {
    this.dialogService.open<unknown, SecretOperation>(SecretDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  copySecretName(name: string) {
    SecretsListComponent.copySecretName(name, this.platformUtilsService, this.i18nService);
  }

  async copySecretValue(id: string) {
    await SecretsListComponent.copySecretValue(
      id,
      this.platformUtilsService,
      this.i18nService,
      this.secretService,
      this.logService,
    );
  }

  copySecretUuid(id: string) {
    SecretsListComponent.copySecretUuid(id, this.platformUtilsService, this.i18nService);
  }
}
