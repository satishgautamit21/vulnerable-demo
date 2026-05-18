import { execSync } from "child_process";

export function validateApp() {

  try {

    console.log(`
Running Tests...
`);

    execSync(
      "npm test",
      {
        stdio: "inherit"
      }
    );

    console.log(`
Running Build...
`);

    execSync(
      "npm run build",
      {
        stdio: "inherit"
      }
    );

    console.log(`
Validation Passed
`);

    return {
      success: true,
      error: null
    };

  } catch (err) {

    console.log(`
Validation Failed
`);

    return {
      success: false,
      error:
        err?.message ||
        "Unknown validation error"
    };
  }
}