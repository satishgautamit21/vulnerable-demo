import { execSync } from "child_process";

export function upgradePackage(
  packageName,
  version
) {

  console.log(`
Upgrading:
${packageName}@${version}
`);

  try {

    execSync(
      `npm install ${packageName}@${version}`,
      {
        stdio: "inherit"
      }
    );

    console.log(`
SUCCESS:
${packageName}@${version}
`);

    return true;

  } catch (err) {

    console.log(`
FAILED:
${packageName}@${version}
`);

    return false;
  }
}