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
'use strict';

const path = require('path');
const pkg = require('../package.json');
const {major, inc} = require('semver');
const fs = require('fs-extra');
const {exec, execOrDie, getStdout} = require('./exec.js');
const {pushPendingCommits, pushPendingTags} = require('./utils.js');

const MAIN_PACKAGE_FILE = 'packages/google-closure-compiler/package.json';
const SUB_PACKAGE_FILES = [
  'packages/google-closure-compiler-java/package.json',
  'packages/google-closure-compiler-linux/package.json',
  'packages/google-closure-compiler-osx/package.json',
  'packages/google-closure-compiler-windows/package.json',
];

// This script should catch and handle all rejected promises.
// If it ever fails to do so, report that and exit immediately.
process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Updates the dependencies and optionalDependencies sections of the given JSON.
 * Returns the updated contents.
 * @param {JSON} packageContents
 * @return {JSON}
 */
function updatePackageDepVersions(packageContents) {
  if (packageContents?.dependencies) {
    const javaDep = '@ampproject/google-closure-compiler-java';
    if (packageContents.dependencies[javaDep]) {
      packageContents.dependencies[javaDep] = packageContents.version;
    }
  }
  ['linux', 'osx', 'windows'].forEach((os) => {
    if (packageContents?.optionalDependencies) {
      const optionalDep = `@ampproject/google-closure-compiler-${os}`;
      if (packageContents.optionalDependencies[optionalDep]) {
        packageContents.optionalDependencies[optionalDep] =
          packageContents.version;
      }
    }
  });
  return packageContents;
}

/**
 * Update a json file with the closure version sepecified. If the major version
 * already matches, bump the patch version of the json file. Returns the updated
 * version.
 * @param {string} packageFile
 * @param {string} closureMajorVersion
 * @return {Promise<string>}
 */
async function updatePackageVersions(packageFile, closureMajorVersion) {
  let packageContents = await fs.readJson(packageFile, 'utf8');
  if (major(packageContents.version) !== closureMajorVersion) {
    packageContents.version = `${closureMajorVersion}.0.0`;
  } else {
    packageContents.version = inc(packageContents.version, 'patch');
  }
  packageContents = updatePackageDepVersions(packageContents);
  await fs.writeJSON(packageFile, packageContents, {spaces: 2});
  console.log(
    'Updated package versions in',
    packageFile,
    'to',
    packageContents.version
  );
  return packageContents.version;
}

(async function () {
  // 1. Retrieve the major version of the published Closure NPM package.
  const closureJavaDep = 'google-closure-compiler-java';
  const closureMajorVersion = major(pkg.dependencies[closureJavaDep]);

  // 2. Update versions within each package.
  const updatedVersion = await updatePackageVersions(
    MAIN_PACKAGE_FILE,
    closureMajorVersion
  );
  await Promise.all(
    SUB_PACKAGE_FILES.map(async (packageFile) => {
      await updatePackageVersions(packageFile, closureMajorVersion);
    })
  );

  // 3. Exit early if no versions were updated.
  const platformSuffixes = [
    '-java',
    '-linux',
    '-osx',
    '-windows',
    '' /* native */,
  ];
  const packageJsonFiles = [];
  platformSuffixes.forEach((platformSuffix) => {
    packageJsonFiles.push(
      path.join(
        'packages',
        `google-closure-compiler${platformSuffix}`,
        'package.json'
      )
    );
  });
  const filesChanged = getStdout(
    `git diff --stat --name-only ${packageJsonFiles.join(' ')}`
  ).trim();
  if (filesChanged.length == 0) {
    console.log('All versions are up to date.');
    return;
  }

  // 4. Create a commit and tag for the new version
  execOrDie(`git config --global user.name "${process.env.GITHUB_ACTOR}"`);
  execOrDie(
    `git config --global user.email "${process.env.GITHUB_ACTOR}@users.noreply.github.com"`
  );
  execOrDie(`git add ${packageJsonFiles.join(' ')}`);
  execOrDie(`git commit -m "v${updatedVersion}"`);
  execOrDie('git clean -d  -f .');
  execOrDie('git checkout -- .');
  pushPendingCommits();
  execOrDie(`git tag "v${updatedVersion}"`);
  pushPendingTags();
})();
