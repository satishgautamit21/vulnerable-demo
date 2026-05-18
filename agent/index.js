import fs from "fs";

import { analyzeAudit } from "./analyzer.js";
import { upgradePackages } from "./upgrader.js";
import { validateApp } from "./validator.js";
import { rollbackChanges } from "./rollback.js";

// import { createPullRequest }
// from "./gitAgent.js";

async function run() {
  console.log("\nAI Upgrade Agent Started\n");

  let failureContext = "";
  let attempt = 0;
  const maxAttempts = 3;
  let hasSuccessfulUpgrade = false;
  let lastPlan = null;

  while (attempt < maxAttempts) {
    console.log(`\nAnalyzing audit (attempt ${attempt + 1})...\n`);
    const plan = await analyzeAudit(failureContext);
    lastPlan = plan;

    if (!plan.upgrades || plan.upgrades.length === 0) {
      console.log("\nNo upgrade recommendations available. Exiting.\n");
      break;
    }

    console.log("\nStarting Upgrades...\n");
    const hasChanges = upgradePackages(plan);

    if (!hasChanges) {
      console.log("\nNo dependency changes detected. Exiting.\n");
      break;
    }

    console.log("\nStarting Validation...\n");
    const isValid = validateApp();

    if (isValid) {
      console.log("\nApplication Stable\n");
      hasSuccessfulUpgrade = true;
      break;
    }

    console.log("\nValidation failed. Rolling back and retrying...\n");
    rollbackChanges();

    const attemptedPackages = plan.upgrades
      .map((item) => `${item.package}@${item.targetVersion}`)
      .join(", ");

    failureContext = `Validation failed after installing ${attemptedPackages}. Please recommend alternative stable versions or skip incompatible packages.`;
    attempt += 1;
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_upgrades=${hasSuccessfulUpgrade}\n`
    );
    if (lastPlan?.upgrades) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `attempt_count=${attempt + 1}\n`
      );
    }
  }

  if (hasSuccessfulUpgrade) {
    console.log("\nUpgrade agent completed with validated upgrades.\n");
  } else {
    console.log("\nUpgrade agent completed without a successful validated upgrade.\n");
  }
}

run();