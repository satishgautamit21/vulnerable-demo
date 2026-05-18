import { execSync }
from "child_process";

import semver from "semver";

export function getAvailableVersions(
  packageName
) {

  try {

    const raw =
      execSync(
        `npm view ${packageName} versions --json`,
        {
          encoding: "utf-8"
        }
      );

    const versions =
      JSON.parse(raw);

    return versions.filter(
      version =>
        !semver.prerelease(version)
    );

  } catch {

    return [];
  }
}

export function getLatestVersion(
  packageName
) {

  const versions =
    getAvailableVersions(
      packageName
    );

  return versions[
    versions.length - 1
  ];
}

export function getPreviousVersions(
  packageName,
  limit = 5
) {

  const versions =
    getAvailableVersions(
      packageName
    );

  return versions
    .slice(-limit)
    .reverse();
}