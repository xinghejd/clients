import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";
import CollectAutofillContentService from "../services/collect-autofill-content.service";
import DomElementVisibilityService from "../services/dom-element-visibility.service";
import InsertAutofillContentService from "../services/insert-autofill-content.service";
import { elementIsInputElement, nodeIsFormElement, sendExtensionMessage } from "../utils";

(function (globalContext) {
  const domElementVisibilityService = new DomElementVisibilityService();
  const collectAutofillContentService = new CollectAutofillContentService(
    domElementVisibilityService,
  );
  const insertAutofillContentService = new InsertAutofillContentService(
    domElementVisibilityService,
    collectAutofillContentService,
  );
  const loginKeywords = [
    "login",
    "log in",
    "log-in",
    "signin",
    "sign in",
    "sign-in",
    "submit",
    "continue",
  ];
  let autoSubmitLoginFlowTimeout: number | NodeJS.Timeout;

  function init() {
    const triggerOnPageLoad = () => setAutoSubmitLoginFlowTimeout(250);
    if (globalContext.document.readyState === "complete") {
      triggerOnPageLoad();
      return;
    }

    globalContext.document.addEventListener("DOMContentLoaded", triggerOnPageLoad);
  }

  async function startAutoSubmitLoginFlow() {
    const pageDetails: AutofillPageDetails = await collectAutofillContentService.getPageDetails();
    if (!pageDetails?.fields?.length) {
      clearAutoSubmitLoginFlowTimeout();
      await updateIsFieldCurrentlyFilling(false);
      return;
    }

    chrome.runtime.onMessage.addListener(handleExtensionMessage);
    await sendExtensionMessage("triggerAutoSubmitLogin", { pageDetails });
  }

  async function handleExtensionMessage({
    command,
    fillScript,
    pageDetailsUrl,
  }: {
    command: string;
    fillScript: AutofillScript;
    pageDetailsUrl: string;
  }) {
    if (
      command !== "triggerAutoSubmitLogin" ||
      (globalContext.document.defaultView || globalContext).location.href !== pageDetailsUrl
    ) {
      return;
    }

    await triggerAutoSubmitLogin(fillScript);
  }

  async function triggerAutoSubmitLogin(fillScript: AutofillScript) {
    if (!fillScript?.autosubmit.length) {
      clearAutoSubmitLoginFlowTimeout();
      await updateIsFieldCurrentlyFilling(false);
      throw new Error("Unable to auto-submit form, no autosubmit reference found.");
    }

    await updateIsFieldCurrentlyFilling(true);
    await insertAutofillContentService.fillForm(fillScript);
    setAutoSubmitLoginFlowTimeout(400);
    triggerAutoSubmitOnForm(fillScript);
  }

  function triggerAutoSubmitOnForm(fillScript: AutofillScript) {
    const formOpid = fillScript.autosubmit[0];

    if (formOpid === null) {
      triggerAutoSubmitOnFormlessFields(fillScript);
      return;
    }

    const formElement = getAutofillFormElementByOpid(formOpid);
    if (!formElement) {
      triggerAutoSubmitOnFormlessFields(fillScript);
      return;
    }

    const genericSubmitElement = collectAutofillContentService.deepQueryElements<HTMLButtonElement>(
      formElement,
      "[type='submit']",
    );
    if (genericSubmitElement[0]) {
      genericSubmitElement[0].click();
      return;
    }

    const buttons = collectAutofillContentService.deepQueryElements<HTMLButtonElement>(
      formElement,
      "button",
    );
    for (let i = 0; i < buttons.length; i++) {
      if (isLoginButton(buttons[i])) {
        buttons[i].click();
        return;
      }
    }

    if (formElement.requestSubmit) {
      formElement.requestSubmit();
      return;
    }

    formElement.submit();
  }

  function triggerAutoSubmitOnFormlessFields(fillScript: AutofillScript) {
    let currentElement = collectAutofillContentService.getAutofillFieldElementByOpid(
      fillScript.script[fillScript.script.length - 1][1],
    );
    const currentElementIsPassword =
      elementIsInputElement(currentElement) && currentElement.type === "password";

    while (currentElement && currentElement.tagName !== "BODY") {
      const genericSubmitElement = collectAutofillContentService.deepQueryElements<HTMLElement>(
        currentElement,
        "[type='submit']",
      );
      if (genericSubmitElement[0]) {
        if (currentElementIsPassword) {
          clearAutoSubmitLoginFlowTimeout();
          void sendMultiStepAutoSubmitLoginComplete();
          void updateIsFieldCurrentlyFilling(false);
        }
        genericSubmitElement[0].click();
        return;
      }

      const buttons = collectAutofillContentService.deepQueryElements<HTMLButtonElement>(
        currentElement,
        "button",
      );
      for (let i = 0; i < buttons.length; i++) {
        if (isLoginButton(buttons[i])) {
          if (currentElementIsPassword) {
            clearAutoSubmitLoginFlowTimeout();
            void sendMultiStepAutoSubmitLoginComplete();
            void updateIsFieldCurrentlyFilling(false);
          }
          buttons[i].click();
          return;
        }
      }

      if (!currentElement.parentElement && currentElement.getRootNode() instanceof ShadowRoot) {
        currentElement = (currentElement.getRootNode() as ShadowRoot).host as any;
        continue;
      }

      currentElement = currentElement.parentElement;
    }
  }

  function isLoginButton(element: HTMLElement) {
    const keywordValues = [
      element.textContent,
      element.getAttribute("value"),
      element.getAttribute("aria-label"),
      element.getAttribute("aria-labelledby"),
      element.getAttribute("aria-describedby"),
      element.getAttribute("title"),
      element.getAttribute("id"),
      element.getAttribute("name"),
      element.getAttribute("class"),
    ]
      .join(",")
      .toLowerCase();

    return loginKeywords.some((keyword) => keywordValues.includes(keyword));
  }

  function getAutofillFormElementByOpid(opid: string): HTMLFormElement | null {
    const cachedFormElements = Array.from(
      collectAutofillContentService.getAutofillFormElements.keys(),
    );
    const formElements = cachedFormElements?.length
      ? cachedFormElements
      : getAutofillFormElements();

    return formElements.find((formElement) => formElement.opid === opid) || null;
  }

  function getAutofillFormElements(): HTMLFormElement[] {
    const formElements: HTMLFormElement[] = [];
    collectAutofillContentService.queryAllTreeWalkerNodes(
      globalContext.document.documentElement,
      (node: Node) => {
        if (nodeIsFormElement(node)) {
          formElements.push(node);
          return true;
        }

        return false;
      },
    );

    return formElements;
  }

  function setAutoSubmitLoginFlowTimeout(delay: number) {
    clearAutoSubmitLoginFlowTimeout();
    autoSubmitLoginFlowTimeout = globalContext.setTimeout(() => startAutoSubmitLoginFlow(), delay);
  }

  function clearAutoSubmitLoginFlowTimeout() {
    if (autoSubmitLoginFlowTimeout) {
      clearInterval(autoSubmitLoginFlowTimeout);
    }
  }

  async function sendMultiStepAutoSubmitLoginComplete() {
    await sendExtensionMessage("multiStepAutoSubmitLoginComplete");
  }

  async function updateIsFieldCurrentlyFilling(isFieldCurrentlyFilling: boolean) {
    await sendExtensionMessage("updateIsFieldCurrentlyFilling", { isFieldCurrentlyFilling });
  }

  init();
})(globalThis);
