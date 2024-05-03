type AutofillOverlayIframeExtensionMessage = {
  command: string;
  styles?: Partial<CSSStyleDeclaration>;
  theme?: string;
  portKey?: string;
};

type AutofillOverlayIframeWindowMessageHandlers = {
  [key: string]: CallableFunction;
  updateAutofillInlineMenuListHeight: (message: AutofillOverlayIframeExtensionMessage) => void;
};

type AutofillOverlayIframeExtensionMessageParam = {
  message: AutofillOverlayIframeExtensionMessage;
};

type BackgroundPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayButton: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  initAutofillOverlayList: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateIframePosition: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateInlineMenuHidden: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateAutofillInlineMenuColorScheme: () => void;
};

interface AutofillOverlayIframeService {
  initMenuIframe(): void;
}

export {
  AutofillOverlayIframeExtensionMessage,
  AutofillOverlayIframeWindowMessageHandlers,
  BackgroundPortMessageHandlers,
  AutofillOverlayIframeService,
};
