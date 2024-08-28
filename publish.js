const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { prompt } = require("enquirer");

const TMP_DIR = fs.mkdtempSync(path.join(require("os").tmpdir(), "marko-website-publish"));
const BUILD_DIR = path.join(__dirname, "build");
const GIT_URL = "https://github.com/marko-js/marko-js.github.io.git";
const GIT_BRANCH = "master";
const DOMAIN = "markojs.com";

(async () => {
  const prompts = [{
    type: "input",
    name: "message",
    initial: "chore: updated static site",
    message: "Please enter a commit message: "
  }];

  if (!process.env.GITHUB_TOKEN) {
    prompts.push({
      type: "input",
      name: "token",
      message: "Please enter your github api token: "
    })
  }

  const { message, token = process.env.GITHUB_TOKEN } = await prompt(prompts);

  // build the static site
  await execLogged(`GITHUB_TOKEN=${token} npm run build`);

  // clone the repo that is the publish target
  await execLogged(
    `cd ${TMP_DIR} && git init && git remote add origin ${GIT_URL} && git fetch`
  );

  // switch to the target branch
  try {
    await execLogged(`cd ${TMP_DIR} && git checkout -t origin/${GIT_BRANCH}`);
  } catch {
    await execLogged(`cd ${TMP_DIR} && git checkout -b ${GIT_BRANCH}`);
  }

  // steal the .git directory
  await execLogged(`mv ${TMP_DIR}/.git ${BUILD_DIR}`);

  // create CNAME file
  await fs.promises.writeFile(path.join(BUILD_DIR, "CNAME"), DOMAIN, "utf-8");

  // commit and push up the changes
  try {
    await execLogged(
      `cd ${BUILD_DIR} && git add . --all && git commit -m "${message}"`
    );
    await execLogged(`cd ${BUILD_DIR} && git push origin ${GIT_BRANCH}`);
    console.log(
      "Static site successfully built and pushed to remote repository."
    );
  } catch (e) {
    if (e.cmd && e.cmd.indexOf("git commit")) {
      console.log("Static site successfully built. No changes to push.");
    }
  } finally {
    await execLogged(`rm -r ${TMP_DIR} ${BUILD_DIR}/.git`);
  }
})();

function execLogged(cmd) {
  console.log(cmd);
  return new Promise((resolve, reject) => {
    cp.exec(cmd, err => (err ? reject(err) : resolve()));
  });
}
