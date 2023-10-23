import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, map } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

import { ProjectListView } from "../../models/view/project-list.view";
import { SecretListView } from "../../models/view/secret-list.view";
import { ProjectService } from "../../projects/project.service";
import { SecretService } from "../secret.service";

export interface SecretMoveProjectOperation {
  secrets: SecretListView[];
  organizationId: string;
}

@Component({
  templateUrl: "./secret-move-project.component.html",
})
export class SecretMoveProjectComponent implements OnInit {
  protected formGroup = new FormGroup({
    project: new FormControl("", [Validators.required]),
  });

  projects: ProjectListView[];
  summary$: Observable<string | null>;

  constructor(
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private data: SecretMoveProjectOperation,
    private projectService: ProjectService,
    private secretService: SecretService,
    private i18nService: I18nService
  ) {
    this.summary$ = this.formGroup.controls.project.valueChanges.pipe(
      map((projectId) => {
        if (Utils.isNullOrWhitespace(projectId)) {
          return null;
        }

        let newAssignments = 0;
        let sameAssignments = 0;
        let overrideAssignments = 0;
        this.data.secrets.forEach((s) => {
          if (s.projects == null || s.projects.length === 0) {
            newAssignments++;
            return;
          }

          // TODO: The logic will need updating if/when secrets can have more than one project
          if (s.projects.some((p) => p.id === projectId)) {
            // This secret has this project already as one of it's projects
            // but as current rules dictate this will be the only project
            // therefore we will consider this a same assignment
            sameAssignments++;
            return;
          }

          // At this point, it has a project assignment but it's not
          // the selected one
          overrideAssignments++;
        });

        return this.i18nService.t(
          "bulkMoveToProjectSummary",
          newAssignments,
          sameAssignments,
          overrideAssignments
        );
      })
    );
  }

  async ngOnInit() {
    this.projects = await this.projectService
      .getProjects(this.data.organizationId)
      .then((projects) => projects.filter((p) => p.write))
      .then((projects) => projects.sort((a, b) => a.name.localeCompare(b.name)));
  }

  move = async () => {
    if (this.formGroup.invalid) {
      return;
    }
    await this.secretService.bulkMoveToProject(
      this.data.organizationId,
      this.data.secrets.map((s) => s.id),
      [this.formGroup.controls.project.value]
    );

    this.dialogRef.close();
  };
}
