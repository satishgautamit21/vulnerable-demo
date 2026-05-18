import { execSync } from "child_process";

export function createSnapshot() {

  console.log(`
Creating git snapshot...
`);

  try {

    execSync(
      "git stash push --include-untracked",
      {
        stdio: "inherit"
      }
    );

    console.log(`
Snapshot created successfully.
`);

  } catch (err) {

    console.log(`
Failed to create snapshot.
`);
  }
}

export function rollbackChanges() {

  console.log(`
Rolling back changes...
`);

  try {

    execSync(
      "git stash pop",
      {
        stdio: "inherit"
      }
    );

    console.log(`
Rollback successful.
`);

  } catch (err) {

    console.log(`
Rollback failed.
`);
  }
}

export function discardSnapshot() {

  console.log(`
Discarding snapshot...
`);

  try {

    execSync(
      "git stash drop",
      {
        stdio: "inherit"
      }
    );

    console.log(`
Snapshot discarded.
`);

  } catch (err) {

    console.log(`
Failed to discard snapshot.
`);
  }
}