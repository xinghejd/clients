import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  combineLatest,
  concatMap,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { SecretsManagerLogo } from "@bitwarden/web-vault/app/layouts/secrets-manager-logo";

import { OrganizationCounts } from "../models/view/counts.view";
import {
  SMOnboardingTasks,
  SMOnboardingTasksService,
} from "../overview/sm-onboarding-tasks.service";
import { ProjectService } from "../projects/project.service";
import { SecretService } from "../secrets/secret.service";
import { ServiceAccountService } from "../service-accounts/service-account.service";
import { SecretsManagerPortingApiService } from "../settings/services/sm-porting-api.service";
import { CountService } from "../shared/counts/count.service";

@Component({
  selector: "sm-navigation",
  templateUrl: "./navigation.component.html",
})
export class NavigationComponent implements OnInit, OnDestroy {
  protected readonly logo = SecretsManagerLogo;
  protected orgFilter = (org: Organization) => org.canAccessSecretsManager;
  protected isAdmin$: Observable<boolean>;
  protected isOrgEnabled$: Observable<boolean>;
  protected organizationCounts: OrganizationCounts;
  private destroy$: Subject<void> = new Subject<void>();
  showOnboarding: boolean;
  onboardingTasks$: Observable<SMOnboardingTasks>;

  constructor(
    protected route: ActivatedRoute,
    private organizationService: OrganizationService,
    private countService: CountService,
    private projectService: ProjectService,
    private secretService: SecretService,
    private serviceAccountService: ServiceAccountService,
    private portingApiService: SecretsManagerPortingApiService,
    private smOnboardingTasksService: SMOnboardingTasksService,
  ) {}

  ngOnInit() {
    this.onboardingTasks$ = this.smOnboardingTasksService.smOnboardingTasks$;

    const org$ = this.route.params.pipe(
      concatMap((params) => this.organizationService.get(params.organizationId)),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    );

    this.isAdmin$ = org$.pipe(
      map((org) => org?.isAdmin),
      takeUntil(this.destroy$),
    );

    this.isOrgEnabled$ = org$.pipe(
      map((org) => org?.enabled),
      takeUntil(this.destroy$),
    );

    combineLatest([
      org$,
      this.projectService.project$.pipe(startWith(null)),
      this.secretService.secret$.pipe(startWith(null)),
      this.serviceAccountService.serviceAccount$.pipe(startWith(null)),
      this.portingApiService.imports$.pipe(startWith(null)),
    ])
      .pipe(
        filter(([org]) => org?.enabled),
        switchMap(([org]) => this.countService.getOrganizationCounts(org.id)),
        takeUntil(this.destroy$),
      )
      .subscribe((organizationCounts) => {
        this.organizationCounts = {
          projects: organizationCounts.projects,
          secrets: organizationCounts.secrets,
          serviceAccounts: organizationCounts.serviceAccounts,
        };
      });

    combineLatest([org$, this.onboardingTasks$])
      .pipe(
        filter(([org]) => org?.enabled),
        switchMap(([org]) => {
          return this.smOnboardingTasksService.findFirstFalseTask(org.isAdmin, org.id);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.showOnboarding = value != "";
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
