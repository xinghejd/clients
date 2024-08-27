import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  map,
  Observable,
  Subject,
  takeUntil,
  distinctUntilChanged,
  firstValueFrom,
  combineLatest,
  switchMap,
  startWith,
  tap,
} from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { DialogService } from "@bitwarden/components";

import {
  ProjectDialogComponent,
  ProjectOperation,
} from "../projects/dialog/project-dialog.component";
import {
  OperationType,
  SecretDialogComponent,
  SecretOperation,
} from "../secrets/dialog/secret-dialog.component";
import {
  ServiceAccountDialogComponent,
  ServiceAccountOperation,
} from "../service-accounts/dialog/service-account-dialog.component";

import { SMOnboardingTasks, SMOnboardingTasksService } from "./sm-onboarding-tasks.service";

type OrganizationTasks = {
  importData: boolean;
  inviteYourTeam: boolean;
  setUpIntegrations: boolean;
  installTheCLI: boolean;
  createProject: boolean;
  createSecret: boolean;
  createServiceAccount: boolean;
  createAccessToken: boolean;
};

@Component({
  selector: "sm-onboarding",
  templateUrl: "./sm-onboarding.component.html",
})
export class SMOnboardingComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();

  private organizationId: string;
  protected userIsAdmin: boolean;
  protected loading = true;
  protected organizationEnabled = false;
  protected onboardingTasks$: Observable<SMOnboardingTasks>;
  protected tasks: SMOnboardingTasks;
  protected linuxAndMacOS1: string = "curl https://bws.bitwarden.com/install | sh";
  protected linuxAndMacOS2: string = "wget -O - https://bws.bitwarden.com/install | sh";
  protected windows: string = "iwr https://bws.bitwarden.com/install | iex";
  protected inviteYourTeamLink?: string;
  protected firstIncompleteTaskKey: string;
  protected createAccessTokenCreationInstructionsLink =
    "https://bitwarden.com/help/secrets-manager-quick-start/#create-an-access-token";

  protected view$: Observable<{
    tasks: OrganizationTasks;
  }>;

  constructor(
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private organizationService: OrganizationService,
    private smOnboardingTasksService: SMOnboardingTasksService,
    private router: Router,
  ) {}

  protected updateOnboardingTasks$ = new Subject<string>();
  private navigationSubscription: any;

  importDataCompleted: boolean = false;
  installTheCLICompleted: boolean = false;
  setUpIntegrationsCompleted: boolean = false;
  createAccessTokenCompleted: boolean = false;
  createMachineAccountCompleted: boolean = false;
  createSecretCompleted: boolean = false;
  createProjectCompleted: boolean = false;
  inviteYourTeamCompleted: boolean = false;
  showCompletedDialog: boolean = true;

  ngOnInit() {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initialize() {
    this.onboardingTasks$ = this.smOnboardingTasksService.smOnboardingTasks$;

    this.view$ = combineLatest([
      this.route.params.pipe(map((p) => p.organizationId)),
      this.updateOnboardingTasks$.pipe(startWith(null)),
    ]).pipe(
      distinctUntilChanged(([prevOrgId, prevOnboardingValue], [currOrgId, currOnboardingValue]) => {
        return prevOrgId === currOrgId && prevOnboardingValue === currOnboardingValue;
      }),
      switchMap(async ([orgId]) => {
        const org = await this.organizationService.get(orgId);
        this.organizationId = org.id;
        this.userIsAdmin = org.isAdmin;
        this.organizationEnabled = org.enabled;
        this.inviteYourTeamLink = `/#/organizations/${this.organizationId}/members`;
        this.firstIncompleteTaskKey = await this.smOnboardingTasksService.findFirstFalseTask(
          org.isAdmin,
          org.id,
        );

        return {
          tasks: await this.updateOnboardingTasks(),
        };
      }),
      tap((_) => (this.loading = false)),
      takeUntil(this.destroy$),
    );
  }

  private async saveCompletedTasks(
    organizationId: string,
    orgTasks: OrganizationTasks,
  ): Promise<OrganizationTasks> {
    const prevTasks = (await firstValueFrom(this.onboardingTasks$)) as {
      [organizationId: string]: OrganizationTasks;
    };
    const prevOrgTasks = prevTasks[organizationId];

    let prevCompletedOrgTasks = null;
    if (prevOrgTasks != null || prevOrgTasks != undefined) {
      prevCompletedOrgTasks = Object.fromEntries(
        Object.entries(prevOrgTasks).filter(([_k, v]) => v === true),
      );
    }

    const newlyCompletedOrgTasks = Object.fromEntries(
      Object.entries(orgTasks).filter(([_k, v]) => v === true),
    );

    const nextOrgTasks = {
      importData: false,
      inviteYourTeam: false,
      setUpIntegrations: false,
      installTheCLI: false,
      createProject: false,
      createSecret: false,
      createServiceAccount: false,
      createAccessToken: false,
      ...prevTasks[organizationId],
      ...newlyCompletedOrgTasks,
    };

    await this.smOnboardingTasksService.setSmOnboardingTasks({
      ...prevTasks,
      [organizationId]: nextOrgTasks,
    });

    this.firstIncompleteTaskKey = await this.smOnboardingTasksService.findFirstFalseTask(
      this.userIsAdmin,
      organizationId,
    );
    this.showCompletedDialog =
      (this.firstIncompleteTaskKey == "" || this.firstIncompleteTaskKey == null) &&
      Object.keys(newlyCompletedOrgTasks).length > 0 &&
      Object.keys(newlyCompletedOrgTasks).length != Object.keys(prevCompletedOrgTasks).length;

    return nextOrgTasks as OrganizationTasks;
  }

  private async updateOnboardingTasks() {
    const updatedTasks = await this.saveCompletedTasks(this.organizationId, {
      createSecret: this.createSecretCompleted,
      createProject: this.createProjectCompleted,
      createServiceAccount: this.createMachineAccountCompleted,
      createAccessToken: this.createAccessTokenCompleted,
      importData: this.importDataCompleted,
      inviteYourTeam: this.inviteYourTeamCompleted,
      setUpIntegrations: this.setUpIntegrationsCompleted,
      installTheCLI: this.installTheCLICompleted,
    });

    if (this.showCompletedDialog) {
      await this.showOnboardingCompletedDialog();
    }

    return updatedTasks;
  }

  async showOnboardingCompletedDialog() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "youveCompletedGettingStarted" },
      content: { key: "ifYouNeedToReferBackToTheGuide" },
      type: "success",
      acceptButtonText: { key: "ok" },
      cancelButtonText: { key: "close" },
    });

    if (confirmed) {
      await this.router.navigate(["/sm/", this.organizationId]);
    }
  }

  async openCreateAccessTokenDocumentation(setComplete: boolean) {
    if (setComplete) {
      await this.completeCreateAccessToken();
    }
  }

  async openNewSecretDialog(setComplete: boolean) {
    if (setComplete) {
      await this.completeCreateSecret();
    }

    this.dialogService.open<unknown, SecretOperation>(SecretDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  async openNewProjectDialog(setComplete: boolean) {
    if (setComplete) {
      await this.completeCreateProject();
    }

    this.dialogService.open<unknown, ProjectOperation>(ProjectDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  async openServiceAccountDialog(setComplete: boolean) {
    if (setComplete) {
      await this.completeCreateMachineAccount();
    }

    this.dialogService.open<unknown, ServiceAccountOperation>(ServiceAccountDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
        organizationEnabled: this.organizationEnabled,
      },
    });
  }

  async completeImportData() {
    this.importDataCompleted = true;
    this.updateOnboardingTasks$.next("importDataCompleted");
  }

  async completeInviteYourTeam() {
    this.inviteYourTeamCompleted = true;
    this.updateOnboardingTasks$.next("completeInviteYourTeam");
  }

  async completeInstallTheCLI() {
    this.installTheCLICompleted = true;
    this.updateOnboardingTasks$.next("completeInstallTheCLI");
  }

  async completeSetUpIntegrations() {
    this.setUpIntegrationsCompleted = true;
    this.updateOnboardingTasks$.next("completeSetUpIntegrations");
  }

  async completeCreateAccessToken() {
    this.createAccessTokenCompleted = true;
    this.updateOnboardingTasks$.next("createAccessTokenCompleted");
  }

  async completeCreateMachineAccount() {
    this.createMachineAccountCompleted = true;
    this.updateOnboardingTasks$.next("createMachineAccountCompleted");
  }

  async completeCreateSecret() {
    this.createSecretCompleted = true;
    this.updateOnboardingTasks$.next("createSecretCompleted");
  }

  async completeCreateProject() {
    this.createProjectCompleted = true;
    this.updateOnboardingTasks$.next("createProjectCompleted");
  }
}
