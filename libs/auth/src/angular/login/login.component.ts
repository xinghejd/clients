import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AsyncActionsModule,
  ButtonModule,
  CheckboxModule,
  FormFieldModule,
} from "@bitwarden/components";

@Component({
  standalone: true,
  templateUrl: "./login.component.html",
  imports: [
    AsyncActionsModule,
    ButtonModule,
    CheckboxModule,
    CommonModule,
    FormFieldModule,
    JslibModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class LoginComponentV2 implements OnInit {
  protected paramEmailSet = false;

  protected formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
  ) {}

  async ngOnInit(): Promise<void> {
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!params) {
        return;
      }

      const qParamsEmail = params.email;

      if (qParamsEmail?.indexOf("@") > -1) {
        this.formGroup.controls.email.setValue(qParamsEmail);

        this.paramEmailSet = true;
      }
    });

    if (!this.paramEmailSet) {
      await this.loadEmailSettings();
    }
  }

  submit = async () => {};

  async validateEmail() {}

  private async loadEmailSettings() {}
}
