/*
  Automates fetching from upstream, rebasing main, and running basic checks.
  Usage: pnpm update:upstream
*/
import { execSync } from "node:child_process";

function run(command: string) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit" });
}

function gitOutput(command: string): string {
  return execSync(command, { stdio: ["ignore", "pipe", "inherit"] })
    .toString()
    .trim();
}

function ensureCleanWorkingTree() {
  const status = gitOutput("git status --porcelain");
  if (status) {
    console.error(
      "Working tree is not clean. Please commit or stash your changes before updating upstream.",
    );
    process.exit(1);
  }
}

function ensureUpstreamRemote() {
  const remotes = gitOutput("git remote").split("\n");
  if (!remotes.includes("upstream")) {
    console.error(
      "Remote 'upstream' is not configured. Run: git remote add upstream https://github.com/cgoinglove/better-chatbot.git",
    );
    process.exit(1);
  }
}

function main() {
  ensureUpstreamRemote();
  ensureCleanWorkingTree();

  // fetch upstream
  run("git fetch upstream");

  // switch to main
  run("git checkout main");

  // rebase onto upstream/main
  run("git rebase upstream/main");

  // install deps and run checks
  run("pnpm i");
  try {
    run("pnpm db:push");
  } catch {
    console.warn("db:push failed or not needed. Continuing.");
  }
  run("pnpm check");

  console.log("\nUpstream update complete. If all good, push your main:");
  console.log("  git push origin main --force-with-lease\n");
}

main();
