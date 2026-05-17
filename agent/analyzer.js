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

    const prompt = `
    You are a senior dependency security expert.

    Analyze vulnerabilities.

    Recommend SAFE stable upgrades.

    Avoid risky major upgrades.

    Return ONLY valid JSON.

    PACKAGE.JSON:
    ${packageJson}

    VULNERABILITY SUMMARY::
    ${JSON.stringify(summary, null, 2)}

    Expected JSON format:

    {
    "upgrades": [
        {
        "package": "",
        "currentVersion": "",
        "targetVersion": "",
        "severity": "",
        "risk": "",
        "reason": ""
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