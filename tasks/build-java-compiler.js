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

const kleur = require("kleur");
const { promises: fs } = require("fs");
const { platform } = require('os');
const { getOsName } = require('./utils.js');
const { getOutput } = require('./exec.js');

/**
 * Copy the newly built compiler and the contrib folder to the applicable packages.
 *
 * @return {!Promise<undefined>}
 */
function copyCompilerBinaries() {
  const compiledJavaBinaryPath = "./dist/compiler.jar";
  return Promise.all([
    fs.copyFile(
      compiledJavaBinaryPath,
      "./packages/google-closure-compiler-java/compiler.jar"
    ),
    fs.copyFile(
      compiledJavaBinaryPath,
      `./packages/google-closure-compiler-${getOsName()}/compiler.jar`
    ),
  ]);
}

/**
 * Generates the custom closure compiler binary (runner.jar) and drops it in the
 * given subdirectory of build-system/runner/dist/ (to enable concurrent usage)
 */
(async function () {
  const compiledJarDir = 'dist';
  const buildFile = 'tasks/build.xml';
  const antExecutable = getOsName() == 'windows' ? 'third_party\\ant\\bin\\ant.bat' : './third_party/ant/bin/ant';
  const generateCmd = `${antExecutable} -buildfile ${buildFile} -Ddist.dir ${compiledJarDir} jar`;
  console.log(
    kleur.green("INFO: ") +
      "Generating custom closure compiler by running " +
      kleur.cyan(generateCmd)
  );
  const result = getOutput(generateCmd, {stdio: 'inherit'});
  if (0 !== result.status) {
    console.log(
      kleur.red("ERROR: ") +
        "Could not generate custom closure compiler " +
        kleur.cyan(`${compiledJarDir}/compiler.jar`)
    );
    console.error(kleur.red(result.stdout), kleur.red(result.stderr));
    process.exit(1);
  }
  console.log(
    kleur.green("SUCCESS: ") +
      "Generated custom closure compiler " +
      kleur.cyan(`${compiledJarDir}/compiler.jar`)
  );

  await copyCompilerBinaries();
  console.log(
    kleur.green("SUCCESS: ") + "Copied custom closure compiler to packages"
  );
})();
