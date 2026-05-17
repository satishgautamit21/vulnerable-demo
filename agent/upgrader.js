import fs from "fs";
import { execSync } from "child_process";
import { calculateRisk } from "./risk.js";

export function upgradePackages() {
    let hasChanges = false;
    const raw = fs.readFileSync(
        "upgrade-plan.json",
        "utf-8"
    );

    const plan = JSON.parse(raw);

    const upgrades =
        plan.upgrades || [];

    for (const item of upgrades) {

        const actualRisk =
            calculateRisk(
                item.currentVersion,
                item.targetVersion
            );

        console.log(`
            Calculated Risk:
            ${actualRisk}
        `);

        if (actualRisk !== "low") {

            console.log(`
                Skipping ${item.package}
                because calculated risk is
                ${actualRisk}
            `);

            continue;
        }

        console.log(`
            Upgrading:
            ${item.package}@${item.targetVersion}
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