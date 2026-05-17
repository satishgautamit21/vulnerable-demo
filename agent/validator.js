import { execSync }
from "child_process";

export function validateApp() {

  try {

    console.log(
      "\nRunning Tests...\n"
    );

    execSync(
      "npm test",
      { stdio: "inherit" }
    );

    console.log(
      "\nRunning Build...\n"
    );

    execSync(
      "npm run build",
      { stdio: "inherit" }
    );

    console.log(
      "\nValidation Passed\n"
    );

    return true;

  } catch (err) {

    console.log(
      "\nValidation Failed\n"
    );

    return false;
  }
}