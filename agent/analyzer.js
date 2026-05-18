import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export async function analyzeAudit(failureContext = "") {

    console.log(
        "\nReading audit report...\n"
    );

    const raw = fs.readFileSync(
        "audit-report.json",
        "utf-8"
    );

    const audit = JSON.parse(raw);

    const packageJson =
        fs.readFileSync(
            "package.json",
            "utf-8"
        );

    const packageData =
        JSON.parse(packageJson);

    const dependencies = {
        ...packageData.dependencies,
        ...packageData.devDependencies
    };

    const vulnerabilities =
        audit.vulnerabilities || {};

    const summary = [];

    for (const [pkg, details]
        of Object.entries(vulnerabilities)) {

        summary.push({
            package: pkg,

            currentVersion:
                dependencies[pkg] || "unknown",

            severity:
                details.severity,

            direct:
                details.isDirect,

            fixAvailable:
                details.fixAvailable
        });
    }

    console.log(
    "\n=== CLEAN SUMMARY ===\n"
    );

    console.log(summary);

    const prompt = `You are a senior dependency security expert. Your task is to RECOMMEND THE LATEST STABLE UPGRADE for each vulnerable package.

For EACH vulnerable package in the list:
1. Identify the latest stable version that fixes the vulnerability
2. Use the newest available stable release even if it is a major upgrade
3. If no fix is available, omit the package from upgrades
4. Do not return an empty upgrades array when vulnerabilities exist and fixes are available
5. Include a short reason and a risk label for each recommended upgrade

${failureContext ? `Previous attempt failed with context:\n${failureContext}\nIf the previous selection caused validation failure, recommend alternate stable versions or skip packages that likely break the build. Trial both higher and lower stable versions if needed.\n\n` : ""}
Current vulnerable packages:
${JSON.stringify(summary, null, 2)}

Return ONLY valid JSON with NO other text:
{
  "upgrades": [
    {
      "package": "package-name",
      "currentVersion": "0.21.0",
      "targetVersion": "1.16.1",
      "severity": "high",
      "risk": "low",
      "reason": "Latest stable version fixing the vulnerability"
    }
  ]
}`;

    console.log(
        "\nSending to AI...\n"
    );

    const response =
        await client.chat.completions.create({
            model: "openai/gpt-oss-20b:free",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0
        });

    const result =
        response.choices[0]
            .message.content;

    console.log(
        "\n=== AI RESPONSE ===\n"
    );

    console.log(result);

    const cleaned = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const jsonStart =
        cleaned.indexOf("{");

    const jsonEnd =
        cleaned.lastIndexOf("}");

    const safeJson =
        cleaned.slice(
            jsonStart,
            jsonEnd + 1
        );

    fs.writeFileSync(
        "upgrade-plan.json",
        safeJson
    );

    return JSON.parse(safeJson);
}