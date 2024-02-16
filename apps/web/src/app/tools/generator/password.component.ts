import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { AbstractControl, FormBuilder } from "@angular/forms";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { concatMap, debounceTime, map, takeUntil, tap } from "rxjs/operators";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  DefaultPasswordGenerationOptions,
  PasswordGenerationOptions,
} from "@bitwarden/common/tools/generator/password/password-generation-options";

import { PASSWORD_GENERATOR, PasswordGenerator, DependenciesModule } from "./dependencies.module";

@Component({
  standalone: true,
  selector: "bit-password-generator",
  templateUrl: "password.component.html",
  imports: [DependenciesModule],
})
export class PasswordGeneratorComponent implements OnInit, OnDestroy {
  @Output() onGeneration = new EventEmitter<string>();
  @Input() ariaDebounceMs = 500;

  // initialize the component
  constructor(
    @Inject(PASSWORD_GENERATOR) private passwordGeneratorService: PasswordGenerator,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private win: Window,
    private formBuilder: FormBuilder,
  ) {}

  // cancels subscriptions when the component is destroyed
  private destroy$ = new BehaviorSubject<boolean>(false);

  // reactive form bindings
  protected optionsGroup = this.formBuilder.group({
    length: this.formBuilder.control(DefaultPasswordGenerationOptions.length),
    avoidAmbiguous: this.formBuilder.control(!DefaultPasswordGenerationOptions.ambiguous),
    uppercase: this.formBuilder.control(DefaultPasswordGenerationOptions.uppercase),
    lowercase: this.formBuilder.control(DefaultPasswordGenerationOptions.lowercase),
    numbers: this.formBuilder.control(DefaultPasswordGenerationOptions.number),
    minNumber: this.formBuilder.control(DefaultPasswordGenerationOptions.minNumber),
    special: this.formBuilder.control(DefaultPasswordGenerationOptions.special),
    minSpecial: this.formBuilder.control(DefaultPasswordGenerationOptions.minSpecial),
  });

  // screen reader bindings
  private optionsMinLength = new BehaviorSubject<number>(
    DefaultPasswordGenerationOptions.minLength,
  );
  protected optionsMinLength$ = this.optionsMinLength.asObservable();
  protected optionsMinLengthForScreenReader$ = this.optionsMinLength$.pipe(
    debounceTime(this.ariaDebounceMs),
    takeUntil(this.destroy$),
  );

  // policy bindings
  protected get policyInEffect$() {
    return this.passwordGeneratorService.policy$.pipe(
      map((policy) => policy.policyInEffect),
      takeUntil(this.destroy$),
    );
  }

  protected get useUppercaseInEffect$() {
    return this.passwordGeneratorService.policy$.pipe(
      map((policy) => policy.policy.useUppercase),
      takeUntil(this.destroy$),
    );
  }

  protected get useLowercaseInEffect$() {
    return this.passwordGeneratorService.policy$.pipe(
      map((policy) => policy.policy.useLowercase),
      takeUntil(this.destroy$),
    );
  }

  protected get useNumbersInEffect$() {
    return this.passwordGeneratorService.policy$.pipe(
      map((policy) => policy.policy.useNumbers),
      takeUntil(this.destroy$),
    );
  }

  protected get useSpecialInEffect$() {
    return this.passwordGeneratorService.policy$.pipe(
      map((policy) => policy.policy.useSpecial),
      takeUntil(this.destroy$),
    );
  }

  // password bindings
  private password = new BehaviorSubject<string>("-");
  protected password$ = this.password.asObservable();

  async ngOnInit() {
    // synchronize password generation options with reactive form fields
    this.passwordGeneratorService.options$.pipe(takeUntil(this.destroy$)).subscribe((options) =>
      this.optionsGroup.patchValue(
        {
          ...options,
          avoidAmbiguous: !options.ambiguous,
        },
        { emitEvent: false },
      ),
    );

    this.passwordGeneratorService.options$
      .pipe(
        map((val) => val.minLength),
        takeUntil(this.destroy$),
      )
      .subscribe(this.optionsMinLength);

    // regenerate the password when the options change and add it to the history
    this.passwordGeneratorService.options$
      .pipe(
        concatMap((options) => this.passwordGeneratorService.generate(options)),
        takeUntil(this.destroy$),
      )
      .subscribe(this.password);

    // emit the generated password when it changes.
    // FIXME: this should be used for a wrapping component to add the history
    // entry instead of this component doing a tap (see above).
    this.password.pipe(takeUntil(this.destroy$)).subscribe(this.onGeneration);

    // clear dependent properties so that they're recalculated
    // when the policy is enforced.
    const dependencies = [
      [this.optionsGroup.controls.minNumber, { numbers: null }],
      [this.optionsGroup.controls.minSpecial, { special: null }],
      [this.optionsGroup.controls.numbers, { minNumber: null }],
      [this.optionsGroup.controls.special, { minSpecial: null }],
    ] as [AbstractControl, Partial<PasswordGenerationOptions>][];

    for (const [control, patch] of dependencies) {
      control.valueChanges
        .pipe(
          tap(() => this.optionsGroup.patchValue(patch, { emitEvent: false })),
          takeUntil(this.destroy$),
        )
        .subscribe();
    }

    // synchronize form changes with storage
    this.optionsGroup.valueChanges
      .pipe(
        map((options) => ({ ...options, ambiguous: !options.avoidAmbiguous })),
        concatMap((options) => this.passwordGeneratorService.enforcePolicy(options)),
        tap((options) => this.passwordGeneratorService.saveOptions(options)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  focusEventTarget($event: Event) {
    const target = $event.target as HTMLInputElement;
    target.focus();
  }

  async copy() {
    const value = await firstValueFrom(this.password$);
    const toast = this.i18nService.t("valueCopied", this.i18nService.t("password"));

    const copyOptions = this.win != null ? { window: this.win } : null;
    this.platformUtilsService.copyToClipboard(value, copyOptions);
    this.platformUtilsService.showToast("info", null, toast);
  }
}
