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

const pkg = require("../package.json");
const semverMajor = require("semver/functions/major");
const semverLt = require("semver/functions/lt");
const fs = require("fs");
const { platform } = require('os');

const isLinux = platform() === 'linux';
const isOSX = platform() === 'darwin';

const PACKAGE_LOCATIONS = [
  "./packages/google-closure-compiler/package.json",
  "./packages/google-closure-compiler-java/package.json",
  isLinux ? "./packages/google-closure-compiler-linux/package.json" : null,
  isOSX ? "./packages/google-closure-compiler-osx/package.json" : null,
].filter(Boolean);

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
  if (semverLt(parsed.version, closureVersion)) {
    parsed.version = closureVersion;
    parsed = additionalModificationMethod(parsed);
    await fs.promises.writeFile(
      location,
      JSON.stringify(parsed, null, 2),
      "utf8"
    );
  }
}

(async function () {
  // 1. Retrieve Closure Version from NPM version published.
  const closureVersion = `${semverMajor(
    pkg.devDependencies["google-closure-compiler-java"]
  )}.0.0`;

  // 2. Update Lerna configuration with the valid Closure Version
  await updatePackage("./lerna.json", closureVersion, (parsed) => parsed);
  
  // 2. Update Major version within each package.
  for await (const packageLocation of PACKAGE_LOCATIONS) {
    await updatePackage(packageLocation, closureVersion, (parsed) => {
      // Ensure the linked dependencies are also using the current released `closure-compiler`.
      const hatClosureVersion = "^" + closureVersion;
      if (
        parsed.dependencies &&
        parsed.dependencies["@kristoferbaxter/google-closure-compiler-java"]
      ) {
        parsed.dependencies[
          "@kristoferbaxter/google-closure-compiler-java"
        ] = hatClosureVersion;
      }
      if (parsed.optionalDependencies) {
        if (
          parsed.optionalDependencies[
            "@kristoferbaxter/google-closure-compiler-linux"
          ]
        ) {
          parsed.optionalDependencies[
            "@kristoferbaxter/google-closure-compiler-linux"
          ] = hatClosureVersion;
        }
        if (
          parsed.optionalDependencies[
            "@kristoferbaxter/google-closure-compiler-osx"
          ]
        ) {
          parsed.optionalDependencies[
            "@kristoferbaxter/google-closure-compiler-osx"
          ] = hatClosureVersion;
        }
      }
    });
  }
})();
