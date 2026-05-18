import { execSync } from "child_process";

export function generateAuditReport() {

  console.log(`
Generating fresh audit report...
`);

  try {

    execSync(
      "npm audit --json > audit-report.json || true",
      {
        stdio: "inherit",
        shell: true
      }
    );

    console.log(`
Audit report generated successfully.
`);

  } catch (err) {

    console.log(`
Failed to generate audit report.
`);

  }
}