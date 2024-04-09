type AutofillOverlayIframeExtensionMessage = {
  command: string;
  styles?: Partial<CSSStyleDeclaration>;
  theme?: string;
  portKey?: string;
};

type AutofillOverlayIframeWindowMessageHandlers = {
  [key: string]: CallableFunction;
  updateAutofillOverlayListHeight: (message: AutofillOverlayIframeExtensionMessage) => void;
};

type AutofillOverlayIframeExtensionMessageParam = {
  message: AutofillOverlayIframeExtensionMessage;
};

type BackgroundPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayButton: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  initAutofillOverlayList: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateIframePosition: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateOverlayHidden: ({ message }: AutofillOverlayIframeExtensionMessageParam) => void;
  updateOverlayPageColorScheme: () => void;
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
