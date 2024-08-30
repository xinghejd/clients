export interface DomQueryService {
  query<T>(
    root: Document | ShadowRoot | Element,
    queryString: string,
    treeWalkerFilter: CallableFunction,
    mutationObserver?: MutationObserver,
  ): T[];
  deepQueryElements<T>(
    root: Document | ShadowRoot | Element,
    queryString: string,
    mutationObserver?: MutationObserver,
  ): T[];
  queryAllTreeWalkerNodes(
    rootNode: Node,
    filterCallback: CallableFunction,
    mutationObserver?: MutationObserver,
  ): Node[];
}
