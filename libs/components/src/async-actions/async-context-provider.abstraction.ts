/**
 * ContextProvider is as an interface that can be implemented by directives and components
 * to provide a context for async actions. This context is used to group buttons and prevent
 * multiple actions from being executed at the same time. The intention is that the source of
 * the currently active action displays a loading state, while other buttons in the
 * same context are disabled.
 */
export abstract class AsyncContextProvider {
  abstract readonly context: string;
}
