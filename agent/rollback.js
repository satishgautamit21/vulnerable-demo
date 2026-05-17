import { execSync }
from "child_process";

export function rollbackChanges() {

  console.log(
    "\nRolling Back Changes...\n"
  );

  try {

    execSync(
      "git checkout package.json package-lock.json",
      { stdio: "inherit" }
    );

    execSync(
      "npm install",
      { stdio: "inherit" }
    );

    console.log(
      "\nRollback Successful\n"
    );

  } catch (err) {

    console.log(
      "\nRollback Failed\n"
    );
  }
}