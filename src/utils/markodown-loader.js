const path = require("path");
const marked = require("marked");

module.exports = function markodown(source) {
  const filePath = this.resourcePath;
  const markdown = source
    .replace(/\&(?!\S+;)/g, "&amp;")
    .replace(/https?:\/\/markojs\.com\//g, "/")
    .replace(/(?<=\]\()\.*([\w\d\-\/]+)\.md/g, match => {
      // Markdown documents from external sources do not have a file path
      if (filePath) {
        const linkpath = path.resolve(path.dirname(filePath), match);
        const linkmatch = /(\/docs\/.*)\.md/.exec(linkpath);
        return (linkmatch && linkmatch[1] + "/") || match;
      }
      return match;
    });

  var markedRenderer = new marked.Renderer();
  var toc = TOC();
  var anchorCache = {};
  var title;

  markedRenderer.table = function(header, body) {
    var output = '<table class="markdown-table">';
    if (header) {
      output += "<thead>" + header + "</thead>";
    }

    if (body) {
      output += "<tbody>" + body + "</tbody>";
    }
    output += "</table>";
    return output;
  };

  markedRenderer.blockquote = function(quote) {
    var match = /^<p><strong>(\w+):<\/strong>/.exec(quote);
    var className = match && match[1].toLowerCase();
    return `<blockquote class="${className}">${quote}</blockquote>`;
  }

  markedRenderer.heading = function(text, level) {
    var anchorName = getAnchorName(text, anchorCache);
    var linkText = text
      .replace(/\s+\([^\)]+\)/g, "")
      .replace(/\([^\)]+\)/g, "()")
      .replace(/<\/?code\>/g, "")
      .replace(/&amp;lt;/g, "&lt;");

    title = title || linkText;

    toc.addHeading(linkText, anchorName, level);

    return (
      `<h${level} class="heading" id="${anchorName}">` +
      `<a class="heading-link" href="#${anchorName}">` +
      text +
      `</a>` +
      `</h${level}>`
    );
  };

  markedRenderer.code = function(code, lang, escaped) {
    var lines = "";
    var index = lang && lang.indexOf("{");

    if (index && index !== -1) {
      lines = lang.slice(index + 1, -1);
      lang = lang.slice(0, index);
    }

    return `<code-block lang="${lang}" lines="${lines}">${code.replace(/<(\/(?:code-block)?>)/g, "&lt;$1")}</code-block>\n`;
  };

  markedRenderer.image = function(href, title, text) {
    let imageCode = `<img src=${JSON.stringify(href)} alt=${JSON.stringify(text || "")} style="max-width:100%"/>`;
    return imageCode;
  };

  const markoSource = marked(markdown, {
    renderer: markedRenderer
  }).replace(/\$/g, "&#36;");

  return `import tocRegistry from ${JSON.stringify(`./${path.relative(path.dirname(filePath), require.resolve("./toc-registry"))}`)};\n` +
  `static tocRegistry.set(${JSON.stringify(path.relative(__dirname, filePath))}, ${JSON.stringify(toc.toHTML())});\n` + `export const title = ${JSON.stringify(title)};\n` + "-----\n" + markoSource + "\n-----\n";
}

function getAnchorName(title, anchorCache) {
  var anchorName = title
    .replace(/<[^>]*>|&[^;]*;/g, "")
    .replace(/[^A-Z0-9\- ]+/gi, "")
    .trim()
    .replace(/[ \-]+/g, "-")
    .toLowerCase();
  var repeat =
    anchorCache[anchorName] != null
      ? ++anchorCache[anchorName]
      : (anchorCache[anchorName] = 0);
  if (repeat) {
    anchorName += "_" + repeat;
  }
  return anchorName;
}

function Node(text, anchorName, level) {
  this.text = text;
  this.anchorName = anchorName;
  this.level = level;
  this.childNodes = [];
}

Node.prototype.toHTML = function(ignoreSelf) {
  var out = "";

  if (!ignoreSelf && this.text && this.anchorName) {
    out += '<a href="#' + this.anchorName + '">' + this.text + "</a>";
  }

  if (this.childNodes.length) {
    out += '<ol class="toc toc-level' + this.level + '">';
    this.childNodes.forEach(function(childNode) {
      out += "<li>" + childNode.toHTML() + "</li>";
    });
    out += "</ol>";
  }

  return out;
};

function TOC() {
  var root = new Node(null, null, 0);
  var currentParent = root;

  return {
    addHeading: function(text, anchorName, level) {
      var curParentLevel = currentParent.level;

      var newNode = new Node(text, anchorName, level);
      var emptyNode;
      var i;

      if (level > curParentLevel + 1) {
        if (currentParent.childNodes.length) {
          currentParent =
            currentParent.childNodes[currentParent.childNodes.length - 1];
        } else {
          emptyNode = new Node(null, null, currentParent.level + 1);
          emptyNode.parent = currentParent;
          currentParent.childNodes.push(emptyNode);
          currentParent = emptyNode;
        }

        while (currentParent.level !== level - 1) {
          emptyNode = new Node(null, null, currentParent.level + 1);
          emptyNode.parent = currentParent;
          currentParent.childNodes.push(emptyNode);
          currentParent = emptyNode;
        }
      } else if (level < currentParent.level + 1) {
        while (currentParent.level !== level - 1) {
          currentParent = currentParent.parent;
        }
      }

      currentParent.childNodes.push(newNode);
      newNode.parent = currentParent;
    },
    toHTML: function() {
      var target = root;

      if (root.childNodes.length === 1) {
        target = root.childNodes[0];
      }

      return target.toHTML(true);
    }
  };
};
