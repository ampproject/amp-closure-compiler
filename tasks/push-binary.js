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
const { exec, execOrDie } = require('./exec.js');
const { getOsName } = require('./utils.js');

/**
 * Push the compiler binary built on this OS after syncing to origin. Also push
 * an updated Java compiler (from just one of the OSs).
 **/
async function main() {
  const osName = getOsName();
  const javaCompiler = path.join('packages', 'google-closure-compiler-java', 'compiler.jar')
  const nativeCompiler = path.join('packages', `google-closure-compiler-${osName}`, osName == 'windows' ? 'compiler.exe' : 'compiler')
  execOrDie(`git config --global user.name "${process.env.GITHUB_ACTOR}"`);
  execOrDie(`git config --global user.email "${process.env.GITHUB_ACTOR}@users.noreply.github.com"`);
  // It's sufficient to update the Java compiler just once
  if (osName == 'linux') {
    execOrDie(`git add ${javaCompiler}`);
    execOrDie('git commit -m "📦 Updated java compiler binary"');
  }
  execOrDie(`git add ${nativeCompiler}`);
  execOrDie(`git commit -m "📦 Updated ${osName} compiler binary"`);
  execOrDie('git clean -d  -f .');
  execOrDie('git checkout -- .');
  if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
    console.log('Verifying files in new commit(s)...')
    execOrDie(`git diff --stat ${process.env.GITHUB_SHA}..HEAD`);
  } else if (process.env.GITHUB_EVENT_NAME == 'push') {
    console.log('Syncing to origin and pushing commit(s)...')
    let retries = 3;
    const delaySec = 10;
    const pushCommits = () => {
      if (retries == 0) {
        console.log('Could not push commit(s) to origin.');
        process.exitCode = 1;
        return;
      };
      if (exec('git pull origin --rebase && git push').status != 0) {
        --retries;
        console.log(`Push failed. Retrying in ${delaySec} seconds...`)
        setTimeout(pushCommits, delaySec * 1000);
      }
    }
    pushCommits();
  }
}

main();
