import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export async function analyzeAudit() {

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

    const prompt = `You are a senior dependency security expert. Your task is to RECOMMEND SAFE UPGRADES for ALL vulnerable packages.

For EACH vulnerable package in the list:
1. Find the latest STABLE version that fixes the vulnerability
2. Prefer patch/minor upgrades (same major version)
3. For 0.x versions, minor upgrades are acceptable
4. Include every package with a fixAvailable solution
5. Do NOT return an empty upgrades array if vulnerabilities exist

Current vulnerable packages:
${JSON.stringify(summary, null, 2)}

For each package, recommend the safest upgrade version that fixes the vulnerability.

Return ONLY valid JSON with NO other text:
{
  "upgrades": [
    {
      "package": "package-name",
      "currentVersion": "0.21.0",
      "targetVersion": "0.27.2",
      "severity": "high",
      "risk": "low",
      "reason": "Brief explanation"
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