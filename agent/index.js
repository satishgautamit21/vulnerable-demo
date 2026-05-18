import fs from "fs";

import {
  analyzePackage,
  getVulnerabilities
} from "./analyzer.js";

import {
  getPreviousVersions
} from "./versionResolver.js";

import { upgradePackage }
from "./upgrader.js";

import { validateApp }
from "./validator.js";

import { rollbackChanges }
from "./rollback.js";

import { generateAuditReport }
from "./audit.js";

async function run() {

  console.log(`
AI Upgrade Agent Started
`);

  let failureContext = "";

  let attempt = 0;

  const maxAttempts = 3;

  let hasSuccessfulUpgrade = false;

  // Generate fresh audit before starting
  generateAuditReport();

  while (attempt < maxAttempts) {

    console.log(`
=== ATTEMPT ${attempt + 1} ===
`);

    // Read ONLY current remaining vulnerabilities
    const vulnerabilities =
      getVulnerabilities();

    if (vulnerabilities.length === 0) {

      console.log(`
No remaining vulnerabilities.
`);

      hasSuccessfulUpgrade = true;

      break;
    }

    console.log(`
Remaining vulnerable packages:
`);

    console.log(
      vulnerabilities.map(
        v => v.package
      )
    );

    let upgradedAnything = false;

    // Process packages ONE BY ONE
    for (const vulnerability of vulnerabilities) {

      console.log(`
Processing package:
${vulnerability.package}
`);

      const recommendation =
        await analyzePackage(
          vulnerability,
          failureContext
        );

      if (
        !recommendation ||
        !recommendation.targetVersion
      ) {

        console.log(`
No valid recommendation for:
${vulnerability.package}
`);

        continue;
      }

      const upgraded =
        upgradePackage(
          recommendation.package,
          recommendation.targetVersion
        );

      if (!upgraded) {

        console.log(`
Upgrade install failed for:
${recommendation.package}
`);

        continue;
      }

      upgradedAnything = true;

      console.log(`
Running validation...
`);

      const isValid =
        validateApp();

      if (!isValid) {

        console.log(`
Validation failed.
Rolling back...
`);

        rollbackChanges();

        failureContext = `
Upgrade failed for:
${recommendation.package}@${recommendation.targetVersion}

Try another stable version.
`;

        continue;
      }

      console.log(`
Validation passed for:
${recommendation.package}
`);

      // IMPORTANT:
      // refresh audit after successful validation
      generateAuditReport();
    }

    if (!upgradedAnything) {

      console.log(`
No successful upgrades possible.
`);

      break;
    }

    attempt++;
  }

  if (process.env.GITHUB_OUTPUT) {

    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_upgrades=${hasSuccessfulUpgrade}\n`
    );
  }

  if (hasSuccessfulUpgrade) {

    console.log(`
Agent completed successfully.
`);

  } else {

    console.log(`
Agent finished without fully resolving vulnerabilities.
`);
  }
}

run();