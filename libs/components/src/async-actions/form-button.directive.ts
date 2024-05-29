import { Directive, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";

import { AsyncContextProvider } from "./async-context-provider.abstraction";
import { BitSubmitDirective } from "./bit-submit.directive";

/**
 * This directive has two purposes:
 *
 * When attached to a submit button:
 * - Activates the button loading effect while the form is processing an async submit action.
 * - Disables the button while a `bitAction` directive on another button is being processed.
 *
 * When attached to a button with `bitAction` directive inside of a form:
 * - Acts as a context provider for the `bitAction` directive, automatically connecting it with
 *   the form's context.
 *
 * Note: you must use a directive that implements the ButtonLikeAbstraction (bitButton or bitIconButton for example)
 * along with this one in order to avoid provider errors.
 */
@Directive({
  selector: "button[bitFormButton]",
  providers: [{ provide: AsyncContextProvider, useExisting: BitFormButtonDirective }],
})
export class BitFormButtonDirective implements AsyncContextProvider, OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input("bitAction") private bitAction: unknown;

  @Input() type: string;
  @Input() disabled?: boolean;

  constructor(
    private buttonComponent: ButtonLikeAbstraction,
    private submitDirective: BitSubmitDirective,
  ) {}

  ngOnInit(): void {
    this.submitDirective.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      if (this.bitAction) {
        // This button already has a bitAction directive, so it will handle it's own state.
        return;
      }

      if (this.type === "submit") {
        this.buttonComponent.loading = state === "loading";
        this.buttonComponent.disabled = state === "disabled";
      } else {
        this.buttonComponent.disabled = state === "loading" || state === "disabled";
      }
    });
  }

  get context() {
    return this.submitDirective.context;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
