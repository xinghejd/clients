type AutofillOverlayIframeExtensionMessage = {
  command: string;
  styles?: Partial<CSSStyleDeclaration>;
};

type AutofillOverlayIframeWindowMessageHandlers = {
  [key: string]: CallableFunction;
  updateAutofillOverlayListHeight: (message: AutofillOverlayIframeExtensionMessage) => void;
};

type BackgroundPortMessageHandlers = {
  [key: string]: CallableFunction;
  updateIframePosition: ({ message }: { message: AutofillOverlayIframeExtensionMessage }) => void;
  updateOverlayHidden: ({ message }: { message: AutofillOverlayIframeExtensionMessage }) => void;
};

interface AutofillOverlayIframeService {
  initOverlayIframe(initStyles: Partial<CSSStyleDeclaration>, ariaAlert?: string): void;
}

export {
  AutofillOverlayIframeExtensionMessage,
  AutofillOverlayIframeWindowMessageHandlers,
  BackgroundPortMessageHandlers,
  AutofillOverlayIframeService,
};
