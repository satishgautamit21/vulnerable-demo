import { execSync } from "child_process";

export function generateAuditReport() {

  console.log("\nGenerating fresh audit report...\n");

  try {

    execSync(
      "npm audit --json > audit-report.json",
      { stdio: "inherit", shell: true }
    );

  } catch {

    // npm audit exits non-zero when vulnerabilities exist
    // that's expected
  }
}