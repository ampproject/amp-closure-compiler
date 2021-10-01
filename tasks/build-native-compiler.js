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

// Note: We download graal since it's 800MB+ of disk space per platform.
const fs = require('fs');
const path = require('path');
const {execOrDie} = require('./exec.js');
const {getOsName} = require('./utils.js');

const graalOsMap = {
  linux: 'linux',
  darwin: 'darwin',
  win32: 'windows',
};

const graalPackageSuffixMap = {
  linux: 'tar.gz',
  darwin: 'tar.gz',
  win32: 'zip',
};

const TEMP_PATH = path.resolve(__dirname, '..', 'temp');
const GRAAL_OS = graalOsMap[process.platform];
const GRAAL_VERSION = '20.2.0';
const GRAAL_FOLDER = `graalvm-ce-java11-${GRAAL_OS}-amd64-${GRAAL_VERSION}`;
const GRAAL_PACKAGE_SUFFIX = graalPackageSuffixMap[process.platform];
const GRAAL_URL =
  process.env.GRAAL_URL ||
  `https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${GRAAL_VERSION}/${GRAAL_FOLDER}.${GRAAL_PACKAGE_SUFFIX}`;

const NATIVE_IMAGE_BUILD_ARGS = [
  '-H:+JNI',
  '--no-server',
  '-H:+ReportUnsupportedElementsAtRuntime',
  '-H:IncludeResourceBundles=org.kohsuke.args4j.Messages',
  '-H:IncludeResourceBundles=org.kohsuke.args4j.spi.Messages',
  '-H:IncludeResourceBundles=com.google.javascript.jscomp.parsing.ParserConfig',
  `-H:ReflectionConfigurationFiles=${path.resolve(
    __dirname,
    'reflection-config.json'
  )}`,
  '-H:IncludeResources="(externs.zip)|(.*(js|txt|typedast))"',
  '-H:+ReportExceptionStackTraces',
  '--initialize-at-build-time',
  '-jar',
  path.resolve(process.cwd(), 'dist', 'compiler.jar'),
].join(' ');

// This script should catch and handle all rejected promises.
// If it ever fails to do so, report that and exit immediately.
process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});

// TODO(rsimha): Refactor and split up this file.
(function () {
  // Build graal from source
  if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH);
    process.stdout.write(`Created directory at ${TEMP_PATH}\n`);
  }

  let buildSteps = Promise.resolve();
  // Download Graal
  const GRAAL_ARCHIVE_FILE = `${GRAAL_FOLDER}.${GRAAL_PACKAGE_SUFFIX}`;
  // Build the compiler native image.
  let pathParts = [TEMP_PATH, `graalvm-ce-java11-${GRAAL_VERSION}`];
  if (GRAAL_OS === 'darwin') {
    pathParts.push('Contents', 'Home', 'bin');
  } else {
    pathParts.push('bin');
  }
  const GRAAL_BIN_FOLDER = path.resolve.apply(null, pathParts);
  if (!fs.existsSync(path.resolve(TEMP_PATH, GRAAL_FOLDER))) {
    const GRAAL_GU_PATH = path.resolve(
      GRAAL_BIN_FOLDER,
      `gu${GRAAL_OS === 'windows' ? '.cmd' : ''}`
    );
    buildSteps = buildSteps
      .then(() => {
        // Download graal and extract the contents
        if (!fs.existsSync(path.resolve(TEMP_PATH, GRAAL_ARCHIVE_FILE))) {
          console.log(`Downloading graal from ${GRAAL_URL}`);
          execOrDie(
            `curl --fail --show-error --location --progress-bar --output ${GRAAL_ARCHIVE_FILE} ${GRAAL_URL}`,
            {cwd: TEMP_PATH}
          );
        }
      })
      .then(() => {
        console.log(`Extracting ${GRAAL_ARCHIVE_FILE}`);
        if (GRAAL_PACKAGE_SUFFIX === 'tar.gz') {
          execOrDie(`tar -xzf ${GRAAL_ARCHIVE_FILE}`, {cwd: TEMP_PATH});
        } else {
          execOrDie(`7z x -y ${GRAAL_ARCHIVE_FILE}`, {cwd: TEMP_PATH});
        }
      })
      .then(() => {
        console.log(`Installing native image from ${GRAAL_GU_PATH}`);
        execOrDie(`${GRAAL_GU_PATH} install native-image`);
      });
  }

  // Build the compiler native image.
  const GRAAL_NATIVE_IMAGE_PATH = path.resolve(
    GRAAL_BIN_FOLDER,
    `native-image${GRAAL_OS === 'windows' ? '.cmd' : ''}`
  );

  const packageDir = path.join(
    'packages',
    `google-closure-compiler-${getOsName()}`
  );

  return buildSteps
    .then(() => {
      console.log(`Testing native image:`);
      fs.writeFileSync(
        path.join(packageDir, 'Foo.java'),
        'public class Foo { public static void main(String[] args){ System.out.println("Hello amp-closure-compiler!"); } }\n'
      );
      execOrDie(GRAAL_OS === 'windows' ? 'type Foo.java' : 'cat Foo.java', {
        cwd: packageDir,
      });
      execOrDie('javac -version', {cwd: packageDir});
      execOrDie('javac Foo.java', {cwd: packageDir});
      execOrDie(`cd ${packageDir} && ${GRAAL_NATIVE_IMAGE_PATH} Foo`);
      execOrDie(`${GRAAL_OS === 'windows' ? 'dir' : 'ls -la'} ${packageDir}`);
      execOrDie(
        path.join(packageDir, GRAAL_OS === 'windows' ? 'foo.exe' : 'foo')
      );
    })
    .then(() => {
      console.log(
        `Building native image: ${GRAAL_NATIVE_IMAGE_PATH} ${NATIVE_IMAGE_BUILD_ARGS}`
      );
      execOrDie(
        `cd ${packageDir} && ${GRAAL_NATIVE_IMAGE_PATH} ${NATIVE_IMAGE_BUILD_ARGS}`
      );
    });
})();
