import fs from "fs";

import { generateAuditReport }
from "./audit.js";

import {
  analyzePackage,
  getVulnerabilities
}
from "./analyzer.js";

import {
  upgradePackage
}
from "./upgrader.js";

import {
  validateApp
}
from "./validator.js";

import {
  createSnapshot,
  rollbackChanges,
  discardSnapshot
}
from "./rollback.js";

async function run() {

  console.log(`
AI Upgrade Agent Started
`);

  const maxAttempts = 3;

  let hasSuccessfulUpgrade = false;

  const failedUpgrades = {};

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    console.log(`
=========================
ATTEMPT ${attempt}
=========================
`);

    generateAuditReport();

    const vulnerabilities =
      getVulnerabilities();

    if (
      vulnerabilities.length === 0
    ) {

      console.log(`
No vulnerabilities remaining.
`);

      break;
    }

    console.log(`
Remaining vulnerabilities:
${vulnerabilities.length}
`);

    for (const vuln of vulnerabilities) {

      console.log(`
-------------------------
Processing:
${vuln.package}
-------------------------
`);

      let failureContext = "";

      let packageFixed = false;

      for (let retry = 1; retry <= 2; retry++) {

        console.log(`
Retry Attempt:
${retry}
`);

        const recommendation =
          await analyzePackage(
            vuln,
            failureContext
          );

        const targetVersion =
          retry === 1
            ? recommendation.targetVersion
            : recommendation.fallbackVersion;

        if (!targetVersion) {

          console.log(`
No version recommendation available.
`);

          break;
        }

        createSnapshot();

        const upgraded =
          upgradePackage(
            vuln.package,
            targetVersion
          );

        if (!upgraded) {

          rollbackChanges();

          failureContext = `
Install failed for:
${vuln.package}@${targetVersion}
`;

          continue;
        }

        const validation =
          validateApp();

        if (validation.success) {

          console.log(`
Validated:
${vuln.package}@${targetVersion}
`);

          discardSnapshot();

          hasSuccessfulUpgrade = true;

          packageFixed = true;

          break;
        }

        rollbackChanges();

        if (!failedUpgrades[vuln.package]) {
          failedUpgrades[vuln.package] = [];
        }

        failedUpgrades[vuln.package]
          .push(targetVersion);

        fs.writeFileSync(
          "failed-upgrades.json",
          JSON.stringify(
            failedUpgrades,
            null,
            2
          )
        );

        failureContext = `
Validation failed for:
${vuln.package}@${targetVersion}

Error:
${validation.error}

Previously failed versions:
${failedUpgrades[vuln.package]
  .join(", ")}
`;
      }

      if (!packageFixed) {

        console.log(`
Skipping package:
${vuln.package}
`);
      }
    }
  }

  if (process.env.GITHUB_OUTPUT) {

    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_upgrades=${hasSuccessfulUpgrade}\n`
    );
  }

  console.log(`
=================================
AI Upgrade Agent Completed
=================================
`);
}

run();