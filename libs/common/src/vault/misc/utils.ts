const fetchNetworkErrorMessages = new Set([
  "Failed to fetch", // Chrome
  "NetworkError when attempting to fetch resource.", // FF
  "fetch failed", // Node
  "The Internet connection appears to be offline.", // Safari
  "Load failed", // Safari
]);

/**
 * Returns true if the error is a network connection error caused by a failed fetch request.
 * Fetch network errors are not the same across all browsers and platforms, so we have to check the error message.
 * See https://github.com/whatwg/fetch/issues/526 for more info
 * @param error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error instanceof TypeError &&
    typeof error.message == "string" &&
    fetchNetworkErrorMessages.has(error.message)
  );
}
