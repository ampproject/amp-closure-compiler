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
 * Push the compiler binary built on this OS after syncing to origin. Also push
 * an updated Java compiler (from just one of the OSs).
 **/
async function main() {
  const osName = getOsName();
  const javaCompilerGlob = path.join('packages', 'google-closure-compiler-java', 'compiler*')
  const nativeCompilerGlob = path.join('packages', `google-closure-compiler-${osName}`, 'compiler*')
  execOrDie(`git config --global user.name "${process.env.GITHUB_ACTOR}"`);
  execOrDie(`git config --global user.email "${process.env.GITHUB_ACTOR}@users.noreply.github.com"`);
  // It's sufficient to update the Java compiler just once
  if (osName == 'linux') {
    execOrDie(`git add ${javaCompilerGlob}`);
    execOrDie('git commit -m "📦 Updated Java compiler binary"');
  }
  execOrDie(`git add ${nativeCompilerGlob}`);
  execOrDie(`git commit -m "📦 Updated compiler binary for ${osName}"`);
  execOrDie('git checkout -- .');
  if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
    console.log('Verifying files in new commit(s)...')
    execOrDie(`git diff --stat ${process.env.GITHUB_SHA}..HEAD`);
  } else if (process.env.GITHUB_EVENT_NAME == 'push') {
    console.log('Syncing to origin and pushing commit(s)...')
    execOrDie('git pull origin --rebase');
    execOrDie('git push');
  }
}

main();
