module.exports = (lang) => {
  if (
    lang === "ts" ||
    lang === "typescript" ||
    lang === "js" ||
    lang === "javascript" ||
    lang === "json" ||
    lang === "jsx"
  ) {
    return "source.ts";
  } else if (lang === "css") {
    return "source.css";
  } else if (lang === "html") {
    return "text.html.basic";
  } else if (lang === "marko") {
    return "text.marko";
  } else if (lang === "bash") {
    return "source.shell";
  } else {
    return "text.basic";
  }
};
