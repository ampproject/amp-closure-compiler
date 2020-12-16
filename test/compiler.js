/*
 * Copyright 2015 The Closure Compiler Authors.
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

/**
 * @fileoverview Tests for compiler.jar versions
 *
 * @author Chad Killingsworth (chadkillingsworth@gmail.com)
 * @author Kristofer Baxter (kristofer@kristoferbaxter.com)
 */

'use strict';

const assert = require('assert');
const {compiler: Compiler} = require('../packages/google-closure-compiler');
const packageInfo = require('../package.json');
const Semver = require('semver');
const compilerVersionMatch = require('./version-match.js');
const spawn = require('child_process').spawnSync;
require('mocha');

process.on('unhandledRejection', (e) => {
  throw e;
});

describe('compiler.jar', function () {
  this.timeout(10000);
  this.slow(5000);

  it('should not be a snapshot build', (done) => {
    const compiler = new Compiler({version: true});
    compiler.run(function (exitCode, stdout, stderr) {
      let versionInfo = (stdout || '').match(compilerVersionMatch);
      assert.notEqual(versionInfo, null);
      versionInfo = versionInfo || [];
      assert.equal(versionInfo.length, 2);
      assert.strictEqual(versionInfo[1].indexOf('SNAPSHOT') < 0, true);
      done();
    });
  });

  it('version should be equal to the package major version', (done) => {
    const compiler = new Compiler({version: true});
    compiler.run(function (exitCode, stdout, stderr) {
      let versionInfo = (stdout || '').match(compilerVersionMatch);
      assert.notEqual(versionInfo, null);
      versionInfo = versionInfo || [];
      assert.equal(versionInfo.length, 2);

      assert.notEqual(Semver.valid(versionInfo[1] + '.0.0'), null);
      assert.strictEqual(
        Semver.major(versionInfo[1] + '.0.0'),
        Semver.major(packageInfo.dependencies['google-closure-compiler-java'])
      );
      done();
    });
  });
});

describe('compiler submodule', function () {
  this.timeout(10000);
  this.slow(5000);

  // TODO (KB): Restore this test it's failing on the get tag spawn.
  it.skip('should be synced to the tagged commit', function () {
    const gitCmd = spawn('git', ['tag', '--points-at', 'HEAD'], {
      cwd: './compiler',
    });
    assert.equal(gitCmd.status, 0);
    const currentTag = gitCmd.stdout.toString().replace(/\s/g, '');
    const mvnVersion =
      'v' +
      Semver.major(packageInfo.dependencies['google-closure-compiler-java']);
    let normalizedTag = currentTag;
    if (normalizedTag) {
      normalizedTag = currentTag.replace(/^([-a-z]+-)?(v\d{8})(.*)$/, '$2');
    }
    assert.equal(normalizedTag, mvnVersion);
  });
});
