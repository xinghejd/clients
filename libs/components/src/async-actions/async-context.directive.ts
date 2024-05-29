import { Directive, Input } from "@angular/core";

import { AsyncContextProvider } from "./async-context-provider.abstraction";

@Directive({
  selector: "[bitAction][context]",
  providers: [{ provide: AsyncContextProvider, useExisting: BitAsyncContextDirective }],
})
export class BitAsyncContextDirective implements AsyncContextProvider {
  @Input({ required: true })
  context: string;
}
