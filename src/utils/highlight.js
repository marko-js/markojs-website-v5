import langToScope from "./lang-to-scope";
import {getTokenizer, getColorMap} from "./language-registry";
const NEW_LINE = /\r\n|[\n\r\u2028\u2029]/;

export default (lang, code) => {
  const tokenizer = getTokenizer(langToScope(lang));
  const colorMap = getColorMap();
  const lines = code.split(NEW_LINE);
  const defaultStyles = toStyle(
    colorMap,
    0, /* Default font */
    1, /* Default foreground color */
    2 /* Default background color */
  );

  let state = tokenizer.getInitialState();
  let html = `<pre class=highlighted${defaultStyles ? ` style=${defaultStyles}` : ""}>`;

  for (const line of lines) {
    if (line !== "") {
      const tokenized = tokenizer.tokenizeEncoded(line, state);
      const { tokens } = tokenized;
      state = tokenized.endState;
  
      for (let i = 0; i < tokens.length; i += 2) {
        const startIndex = tokens[i];
        const meta = tokens[i + 1];
        const endIndex = tokens[i + 2];
        const content = line.slice(startIndex, endIndex).replace(/</g, "&lt;");
        const style = metaToStyle(colorMap, meta);
        html += style ? `<span style=${style}>${content}</span>` : content;
      }
    }

    html += "\n";
  }

  html += "</pre>";

  return html;
};

function metaToStyle(colorMap, meta) {
  let fontStyle = (meta & 14336) /* FONT_STYLE_MASK */ >>> 11 /* FONT_STYLE_OFFSET */;
  let foregroundColor = (meta & 8372224) /* FOREGROUND_MASK */ >>> 14 /* FOREGROUND_OFFSET */;
  let backgroundColor = (meta & 4286578688) /* BACKGROUND_MASK */ >>> 23 /* BACKGROUND_OFFSET */;

  if (foregroundColor === 1 /* Default foreground color */) {
    foregroundColor = 0;
  }

  if (backgroundColor === 2 /* Default background color */) {
    backgroundColor = 0;
  }

  return toStyle(colorMap, fontStyle, foregroundColor, backgroundColor);
}

function toStyle(colorMap, fontStyle, foregroundColor, backgroundColor) {
  let result = "";

  if (foregroundColor > 0) {
    result += `color:${colorMap[foregroundColor]};`;
  }

  if (backgroundColor > 0) {
    result += `background-color:${colorMap[backgroundColor]};`;
  }

  if (fontStyle > 0) {
    if (fontStyle & 1 /* FONT_ITALIC */) {
      result += "font-style:italic;";
    }

    if (fontStyle & 2 /* FONT_BOLD */) {
      result += "font-weight:bold;";
    }

    if (fontStyle & 4 /* FONT_UNDERLINE */) {
      result += "font-decoration:underline;";
    }
  }

  if (result) {
    return result.slice(0, -1);
  }

  return result;
}
