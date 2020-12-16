#!/usr/bin/env node
/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const path = require('path');
const pkg = require("../package.json");
const semverMajor = require("semver/functions/major");
const fs = require("fs");
const { exec, execOrDie, getStdout } = require('./exec.js');
const { pushPendingCommits, pushPendingTags } = require('./utils.js');

const PACKAGE_LOCATIONS = [
  "./packages/google-closure-compiler/package.json",
  "./packages/google-closure-compiler-java/package.json",
  "./packages/google-closure-compiler-linux/package.json",
  "./packages/google-closure-compiler-osx/package.json",
  "./packages/google-closure-compiler-windows/package.json",
];

// This script should catch and handle all rejected promises.
// If it ever fails to do so, report that and exit immediately.
process.on("unhandledRejection", (error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Update a json file with the closure version sepecified, give caller a chance to modify the content too.
 * @param {string} location
 * @param {string} closureVersion
 * @param {(parsed: JSON) => JSON} additionalModificationMethod
 * @return {Promise<void>}
 */
async function updatePackage(location, closureVersion, additionalModificationMethod) {
  const packageContents = await fs.promises.readFile(location, "utf8");
  let parsed = JSON.parse(packageContents);
  if (semverMajor(parsed.version) !== semverMajor(closureVersion)) {
    parsed.version = closureVersion;
    parsed = additionalModificationMethod(parsed);
    await fs.promises.writeFile(
      location,
      JSON.stringify(parsed, null, 2) + '\n',
      "utf8"
    );
  }
}

(async function () {
  // 1. Retrieve Closure Version from NPM version published.
  const closureVersion = `${semverMajor(
    pkg.dependencies["google-closure-compiler-java"]
  )}.0.0`;

  // 2. Update Major version within each package.
  for await (const packageLocation of PACKAGE_LOCATIONS) {
    await updatePackage(packageLocation, closureVersion, (parsed) => {
      // Ensure the linked dependencies are also using the current released `closure-compiler`.
      if (
        parsed.dependencies &&
        parsed.dependencies["@ampproject/google-closure-compiler-java"]
      ) {
        parsed.dependencies[
          "@ampproject/google-closure-compiler-java"
        ] = closureVersion;
      }
      if (parsed.optionalDependencies) {
        if (
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-linux"
          ]
        ) {
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-linux"
          ] = closureVersion;
        }
        if (
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-osx"
          ]
        ) {
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-osx"
          ] = closureVersion;
        }
        if (
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-windows"
          ]
        ) {
          parsed.optionalDependencies[
            "@ampproject/google-closure-compiler-windows"
          ] = closureVersion;
        }
      }

      return parsed;
    });
  }

  // 3. Exit early if no versions were updated.
  const platformSuffixes = ['-java', '-linux', '-osx', '-windows', '' /* native */];
  const packageJsonFiles = [];
  platformSuffixes.forEach(platformSuffix => {
    packageJsonFiles.push(path.join('packages', `google-closure-compiler${platformSuffix}`, 'package.json'))
  });
  const filesChanged = getStdout(
      `git diff --stat --name-only ${packageJsonFiles.join (' ')}`).trim();
  if (filesChanged.length == 0) {
    console.log('All versions are up to date.');
    return;
  }

  // 4. Create a commit and tag for the new version
  execOrDie(`git config --global user.name "${process.env.GITHUB_ACTOR}"`);
  execOrDie(`git config --global user.email "${process.env.GITHUB_ACTOR}@users.noreply.github.com"`);
  execOrDie(`git add ${packageJsonFiles.join (' ')}`);
  execOrDie(`git commit -m "v${closureVersion}"`);
  execOrDie('git clean -d  -f .');
  execOrDie('git checkout -- .');
  pushPendingCommits();
  execOrDie(`git tag "v${closureVersion}"`);
  pushPendingTags();
})();
