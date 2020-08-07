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
const { execOrDie } = require("./exec.js");

/**
 * Mapping from process.platform to the OS name / directory.
 */
const platformOsMap = {
  linux: 'linux',
  darwin: 'osx',
  win32: 'windows',
}

/**
 * Push all compiler binaries built on this OS after syncing to origin
 **/
(async function () {
  const osName = platformOsMap[process.platform];
  const compilerBinaries = path.join('packages', `google-closure-compiler-${osName}`, 'compiler*')
  execOrDie(`git add ${compilerBinaries}`);
  execOrDie(`git commit -m "Push new ${osName} compiler binaries"`);
  execOrDie('git pull --rebase');
  execOrDie('git push');
})();


