import { Directive, Input } from "@angular/core";

import { ContextProvider } from "./context-provider.abstraction";

@Directive({
  selector: "[bitAction][context]",
  providers: [{ provide: ContextProvider, useExisting: BitContextProviderDirective }],
})
export class BitContextProviderDirective implements ContextProvider {
  @Input({ required: true })
  context: string;
}
