// We don't bring in the full Marko compiler, but the ast types are needed.
exports.types = require("./dist/babel-types");

const crypto = require("crypto");
const createHash = crypto.createHash;

if (!crypto.getHashes().includes("shake256")) {
  crypto.createHash = (alg, opts) => {
    if (alg !== "shake256") return createHash(alg, opts);

    const hash = createHash("md5", opts);
    return {
      update(val) {
        hash.update(val);
        return this;
      },
      digest(enc) {
        if (opts.outputLength) {
          return hash.digest(enc).slice(0, opts.outputLength)
        }

        return hash.digest(enc);
      }
    }
  }
}
