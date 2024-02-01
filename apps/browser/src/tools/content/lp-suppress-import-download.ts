(function (globalContext) {
  let csvDownload = "";
  let csvHref = "";
  const defaultAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function (newChild: Node) {
    if (newChild.nodeName.toLowerCase() === "a" && (newChild as HTMLAnchorElement).download) {
      csvDownload = (newChild as HTMLAnchorElement).download;
      csvHref = (newChild as HTMLAnchorElement).href;
      (newChild as HTMLAnchorElement).setAttribute("href", "javascript:void(0)");
      (newChild as HTMLAnchorElement).setAttribute("download", "");
      Element.prototype.appendChild = defaultAppendChild;
    }

    return defaultAppendChild.call(this, newChild);
  };

  globalContext.addEventListener("message", (event) => {
    const command = event.data?.command;
    if (event.source !== globalContext || command !== "triggerCsvDownload") {
      return;
    }

    const anchor = globalContext.document.createElement("a");
    anchor.setAttribute("href", csvHref);
    anchor.setAttribute("download", csvDownload);
    globalContext.document.body.appendChild(anchor);
    anchor.click();
    globalContext.document.body.removeChild(anchor);
  });
})(window);
