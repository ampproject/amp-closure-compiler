#!/usr/bin/env node
/*
 * Copyright 2019 The Closure Compiler Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const nativeImagePath = require('./');
const kleur = require('kleur');

process.stdout.write('google-closure-compiler-windows\n');
if (process.platform !== 'win32') {
  process.stdout.write(`  ${kleur.dim('skipping tests - incorrect platform')}\n`);
} else if (fs.existsSync(nativeImagePath)) {
  process.stdout.write(`  ${kleur.green('✓')} ${kleur.dim('compiler binary exists')}\n`);
  new Promise(
      (resolve, reject) => {
        const compilerTest = spawn(
          nativeImagePath,
            ['--version'],
            {stdio: 'inherit'});
        compilerTest.on('error', err => {
          reject(err);
        });
        compilerTest.on('close', exitCode => {
          if (exitCode != 0) {
            return reject('non zero exit code');
          }
          process.stdout.write(
              `  ${kleur.green('✓')} ${kleur.dim('compiler version successfully reported')}\n`);
          resolve();
        });
      })
      .then(() => new Promise((resolve, reject) => {
        const compilerTest = spawn(
          nativeImagePath,
            ['--help'],
            {stdio: 'inherit'});
        compilerTest.on('error', err => {
          reject(err);
        });
        compilerTest.on('close', exitCode => {
          if (exitCode != 0) {
            return reject('non zero exit code');
          }
          process.stdout.write(
              `  ${kleur.green('✓')} ${kleur.dim('compiler help successfully reported')}\n`);
          resolve();
        });
      }))
      .catch(err => {
        process.stderr.write((err || '').toString() + '\n');
        process.stdout.write(`  ${kleur.red('compiler execution tests failed')}\n`);
        process.exitCode = 1;
      });
} else {
  process.stdout.write(`  ${kleur.red('compiler binary does not exist')}\n`);
  process.exitCode = 1;
}
