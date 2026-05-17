import { analyzeAudit }
from "./analyzer.js";

import { upgradePackages }
from "./upgrader.js";

import { validateApp }
from "./validator.js";

import { rollbackChanges }
from "./rollback.js";

import { createPullRequest }
from "./gitAgent.js";

async function run() {

  console.log(
    "\nAI Upgrade Agent Started\n"
  );

  await analyzeAudit();

  console.log(
    "\nStarting Upgrades...\n"
  );

  upgradePackages();

  console.log(
    "\nStarting Validation...\n"
  );

  const isValid =
    validateApp();

  if (!isValid) {

    rollbackChanges();

  } else {

    console.log(`
Application Stable
`);
createPullRequest();
  }
}

run();