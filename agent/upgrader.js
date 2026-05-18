import fs from "fs";
import { execSync } from "child_process";

export function upgradePackages(plan) {
    let hasChanges = false;
    fs.writeFileSync(
        "upgrade-plan.json",
        JSON.stringify(plan, null, 2)
    );

    const upgrades =
        plan.upgrades || [];

    for (const item of upgrades) {

        if (!item.targetVersion || item.targetVersion === item.currentVersion) {
            console.log(`
                Skipping ${item.package}
                because targetVersion is missing or unchanged
            `);
            continue;
        }

        console.log(`
            Upgrading:
            ${item.package}@${item.targetVersion}
            Plan risk: ${item.risk || "unknown"}
        `);

        try {

            execSync(
                `npm install ${item.package}@${item.targetVersion}`,
                { stdio: "inherit" }
            );

            console.log(`
                SUCCESS:
                ${item.package}
            `);
            hasChanges = true;

        } catch (err) {

            console.log(`
                FAILED:
                ${item.package}
            `);
        }
    }
    return hasChanges;
}