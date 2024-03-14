import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { AbstractControl, FormBuilder } from "@angular/forms";
import {
  Observable,
  Subject,
  BehaviorSubject,
  concatMap,
  debounceTime,
  firstValueFrom,
  map,
  share,
  takeUntil,
  zip,
} from "rxjs";

import { WINDOW } from "@bitwarden/angular/services/injection-tokens";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  DefaultPasswordGenerationOptions,
  PasswordGenerationOptions,
} from "@bitwarden/common/tools/generator/password/password-generation-options";

import {
  PASSWORD_GENERATOR,
  PasswordGenerator,
  DependenciesModule,
  PasswordEvaluator,
} from "./dependencies.module";

/** Form for generating randomized passwords */
@Component({
  standalone: true,
  selector: "bit-password-generator",
  templateUrl: "password.component.html",
  imports: [DependenciesModule],
})
export class PasswordGeneratorComponent implements OnInit, OnDestroy {
  /** Emits a password each time one is generated */
  @Output() onGeneration = new EventEmitter<string>();

  /** Length of time to wait in milliseconds before telling the user
   *  a rapidly-updating field has changed.
   */
  @Input() ariaDebounceMs = 500;

  /** initializes the component
   * @param passwordGeneratorService applies password generation logic
   * @param platformUtilsService clipboard access and toast display
   * @param i18nService internationalize toast messages
   * @param formBuilder reactive options binding
   * @param win clipboard access
   */
  constructor(
    @Inject(WINDOW) private win: Window,
    @Inject(PASSWORD_GENERATOR) private passwordGeneratorService: PasswordGenerator,
    private accountService: AccountService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private formBuilder: FormBuilder,
  ) {
    this.options$ = this.accountService.activeAccount$.pipe(
      concatMap(({ id }) => this.passwordGeneratorService.options$(id)),
      takeUntil(this.destroy$),
      share(),
    );

    this.evaluator$ = this.accountService.activeAccount$.pipe(
      concatMap((p) => this.passwordGeneratorService.evaluator$(p.id)),
      takeUntil(this.destroy$),
      share(),
    );
  }

  // cancels subscriptions when the component is destroyed
  private destroy$ = new Subject<void>();

  /** reactive form bindings */
  protected optionsGroup = this.formBuilder.group({
    length: [DefaultPasswordGenerationOptions.length],
    avoidAmbiguous: [!DefaultPasswordGenerationOptions.ambiguous],
    uppercase: [DefaultPasswordGenerationOptions.uppercase],
    lowercase: [DefaultPasswordGenerationOptions.lowercase],
    numbers: [DefaultPasswordGenerationOptions.number],
    minNumber: [DefaultPasswordGenerationOptions.minNumber],
    special: [DefaultPasswordGenerationOptions.special],
    minSpecial: [DefaultPasswordGenerationOptions.minSpecial],
  });

  private optionsMinLength = new BehaviorSubject<number>(
    DefaultPasswordGenerationOptions.minLength,
  );

  private readonly evaluator$: Observable<PasswordEvaluator>;
  private readonly options$: Observable<PasswordGenerationOptions>;

  /** the minimum length allowed for the password */
  protected optionsMinLength$ = this.optionsMinLength.asObservable();

  /** the minimum length allowed for the password that emits after `areaDebounceMs` */
  protected optionsMinLengthForScreenReader$ = this.optionsMinLength$.pipe(
    debounceTime(this.ariaDebounceMs),
    takeUntil(this.destroy$),
  );

  /** Emits `true` when a policy is active and `false` otherwise. */
  protected get policyInEffect$() {
    return this.evaluator$.pipe(map((policy) => policy.policyInEffect));
  }

  /** Emits `true` when the password must contain an uppercase character
   *  and `false` otherwise.
   */
  protected get useUppercaseInEffect$() {
    return this.evaluator$.pipe(map((policy) => policy.policy.useUppercase));
  }

  /** Emits `true` when the password must contain a lowercase character
   *  and `false` otherwise.
   */
  protected get useLowercaseInEffect$() {
    return this.evaluator$.pipe(map((policy) => policy.policy.useLowercase));
  }

  /** Emits `true` when the password must contain a digit
   *  and `false` otherwise.
   */
  protected get useNumbersInEffect$() {
    return this.evaluator$.pipe(map((policy) => policy.policy.useNumbers));
  }

  /** Emits `true` when the password must contain a special character
   *  and `false` otherwise.
   */
  protected get useSpecialInEffect$() {
    return this.evaluator$.pipe(map((policy) => policy.policy.useSpecial));
  }

  private password = new BehaviorSubject<string>("-");
  /** Emits the latest generated password.
   */
  protected password$ = this.password.asObservable();

  /** {@link OnInit.ngOnInit} */
  async ngOnInit() {
    // synchronize password generation options with reactive form fields
    this.options$.pipe(takeUntil(this.destroy$)).subscribe((options) =>
      this.optionsGroup.patchValue(
        {
          ...options,
          avoidAmbiguous: !options.ambiguous,
        },
        { emitEvent: false },
      ),
    );

    this.options$
      .pipe(
        map((val) => val.minLength),
        takeUntil(this.destroy$),
      )
      .subscribe(this.optionsMinLength);

    // regenerate the password when the options change and add it to the history
    this.options$
      .pipe(
        concatMap((options) => this.passwordGeneratorService.generate(options)),
        takeUntil(this.destroy$),
      )
      .subscribe(this.password);

    // emit the generated password when it changes.
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
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.optionsGroup.patchValue(patch, { emitEvent: false }));
    }

    // synchronize form changes with storage
    zip(this.accountService.activeAccount$, this.optionsGroup.valueChanges)
      .pipe(
        map(
          ([{ id }, options]) => [id, { ...options, ambiguous: !options.avoidAmbiguous }] as const,
        ),
        concatMap(
          async ([id, options]) =>
            [id, await this.passwordGeneratorService.enforcePolicy(id, options)] as const,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([id, options]) => this.passwordGeneratorService.saveOptions(id, options));
  }

  /** {@link OnDestroy.ngOnDestroy} */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Moves the caret to a control when it emits an event */
  focusEventTarget($event: Event) {
    const target = $event.target as HTMLInputElement;
    target.focus();
  }

  /** Copies the last generated password to the clipboard */
  async copy() {
    const value = await firstValueFrom(this.password$);
    const toast = this.i18nService.t("valueCopied", this.i18nService.t("password"));

    const copyOptions = this.win != null ? { window: this.win } : null;
    this.platformUtilsService.copyToClipboard(value, copyOptions);
    this.platformUtilsService.showToast("info", null, toast);
  }
}
