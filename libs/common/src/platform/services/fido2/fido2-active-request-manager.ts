import {
  BehaviorSubject,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
  startWith,
  Subject,
} from "rxjs";

import { Fido2CredentialView } from "../../../vault/models/view/fido2-credential.view";
import {
  ActiveRequest,
  RequestCollection,
  Fido2ActiveRequestManager as Fido2ActiveRequestManagerAbstraction,
} from "../../abstractions/fido2/fido2-active-request-manager.abstraction";

export class Fido2ActiveRequestManager implements Fido2ActiveRequestManagerAbstraction {
  private activeRequests$: BehaviorSubject<RequestCollection> = new BehaviorSubject({});

  getActiveRequest$(tabId: number): Observable<ActiveRequest | undefined> {
    return this.activeRequests$.pipe(
      map((requests) => requests[tabId]),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
      startWith(undefined),
    );
  }

  getActiveRequest(tabId: number): ActiveRequest | undefined {
    return this.activeRequests$.value[tabId];
  }

  async newActiveRequest(
    tabId: number,
    credentials: Fido2CredentialView[],
    abortController: AbortController,
  ): Promise<string> {
    const newRequest: ActiveRequest = {
      credentials,
      subject: new Subject(),
    };
    this.updateRequests((existingRequests) => ({
      ...existingRequests,
      [tabId]: newRequest,
    }));

    const abortListener = () => this.abortActiveRequest(tabId);
    abortController.signal.addEventListener("abort", abortListener);
    const credentialId = firstValueFrom(newRequest.subject);
    abortController.signal.removeEventListener("abort", abortListener);

    return credentialId;
  }

  removeActiveRequest(tabId: number) {
    this.abortActiveRequest(tabId);
    this.updateRequests((existingRequests) => {
      const newRequests = { ...existingRequests };
      delete newRequests[tabId];
      return newRequests;
    });
  }

  private abortActiveRequest(tabId: number): void {
    this.activeRequests$.value[tabId]?.subject.error(
      new DOMException("The operation either timed out or was not allowed.", "AbortError"),
    );
  }

  private updateRequests(
    updateFunction: (existingRequests: RequestCollection) => RequestCollection,
  ) {
    this.activeRequests$.next(updateFunction(this.activeRequests$.value));
  }
}
