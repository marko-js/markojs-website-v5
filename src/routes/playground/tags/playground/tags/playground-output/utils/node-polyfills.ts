import path from "path";
import assert from "assert";
import crypto from "crypto";
import util from "util";
import module from "module";
import tty from "tty";

declare global {
  var nodePolyfills: any;
}

globalThis.nodePolyfills = {
  path,
  assert,
  crypto,
  util,
  module,
  tty,
  fs: globalThis.fs,
};
