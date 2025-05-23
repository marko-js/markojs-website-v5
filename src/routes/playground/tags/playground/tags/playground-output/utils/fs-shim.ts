export function fsShim(
  files: Record<string, string>,
): Pick<
  typeof import("fs"),
  "statSync" | "readFileSync" | "readdirSync" | "readFile"
> {
  return {
    statSync(filePath: string) {
      if (!(filePath in files)) {
        const checkDir = filePath.endsWith("/") ? filePath : filePath + "/";
        if (!Object.keys(files).some((f) => f.startsWith(checkDir)))
          throw new Error();
        return { mtime: 1, isFile: () => false, isDirectory: () => true };
      }
      return { mtime: 1, isFile: () => true, isDirectory: () => false };
    },
    readFileSync(filePath: string) {
      if (!(filePath in files)) throw new Error();
      return files[filePath];
    },
    readFile(
      filePath: string,
      _encoding: string,
      cb: (err: any, src: string) => void,
    ) {
      try {
        cb(null, this.readFileSync(filePath));
      } catch (e) {
        cb(e, "");
      }
    },
    readdirSync(dirname: string) {
      const checkDir = dirname.endsWith("/") ? dirname : dirname + "/";
      const dirFiles: string[] = [];
      for (const filePath of Object.keys(files)) {
        if (filePath.startsWith(checkDir)) {
          dirFiles.push(filePath.substring(checkDir.length));
        }
      }

      return dirFiles as any;
    },
  } as any;
}
