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
const { execOrDie } = require('./exec.js');
const { getOsName } = require('./utils.js');

/**
 * Push the compiler binary built on this OS after syncing to origin
 **/
async function main() {
  const nativeCompilerGlob = path.join('packages', `google-closure-compiler-${getOsName()}`, 'compiler*')
  execOrDie(`git config --global user.name "${process.env.GITHUB_ACTOR}"`);
  execOrDie(`git config --global user.email "${process.env.GITHUB_ACTOR}@users.noreply.github.com"`);
  execOrDie(`git add ${nativeCompilerGlob}`);
  execOrDie(`git commit -m "📦 Updated compiler binary for ${osName}"`);
  execOrDie('git checkout -- .');
  execOrDie('git pull origin --rebase');
  execOrDie('git push');
}

main();
