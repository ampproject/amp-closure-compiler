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

// Note: We download graal since it's 800MB+ of disk space per platform.
const fs = require("fs");
const path = require("path");
const runCommand = require("./run-command.js");

const TEMP_PATH = path.resolve(__dirname, "..", "temp");
const GRAAL_OS = process.platform;
const GRAAL_VERSION = "20.1.0";
const GRAAL_FOLDER = `graalvm-ce-java8-${GRAAL_OS}-amd64-${GRAAL_VERSION}`;
const GRAAL_PACKAGE_SUFFIX = "tar.gz";
const GRAAL_URL =
  process.env.GRAAL_URL ||
  `https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${GRAAL_VERSION}/${GRAAL_FOLDER}.tar.gz`;

const NATIVE_IMAGE_BUILD_ARGS = [
  "-H:+JNI",
  "--no-server",
  "-H:+ReportUnsupportedElementsAtRuntime",
  "-H:IncludeResourceBundles=com.google.javascript.rhino.Messages",
  "-H:IncludeResourceBundles=org.kohsuke.args4j.Messages",
  "-H:IncludeResourceBundles=org.kohsuke.args4j.spi.Messages",
  "-H:IncludeResourceBundles=com.google.javascript.jscomp.parsing.ParserConfig",
  `-H:ReflectionConfigurationFiles=${path.resolve(
    __dirname,
    "reflection-config.json"
  )}`,
  "-H:IncludeResources=(externs.zip)|(.*(js|txt))", //.replace(
  //   /[\|\(\)]/g,
  //   (match) => {
  //     if (GRAAL_OS === "windows") {
  //       // Escape the '|' character in a  windows batch command
  //       // See https://stackoverflow.com/a/16018942/1211524
  //       if (match === "|") {
  //         return "%PIPE%";
  //       }
  //       return `^${match}`;
  //     }
  //     return "|";
  //   }
  // ),
  "-H:+ReportExceptionStackTraces",
  "--initialize-at-build-time",
  "-jar",
  path.resolve(process.cwd(), "..", "..", "dist", "compiler.jar"),
];

// This script should catch and handle all rejected promises.
// If it ever fails to do so, report that and exit immediately.
process.on("unhandledRejection", (error) => {
  console.error(error);
  process.exit(1);
});

(function () {
  console.log(NATIVE_IMAGE_BUILD_ARGS);

  // Build graal from source
  if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH);
    process.stdout.write(`Created directory at ${TEMP_PATH}\n`);
  }

  let buildSteps = Promise.resolve();
  // Download Graal
  const GRAAL_ARCHIVE_FILE = `${GRAAL_FOLDER}.${GRAAL_PACKAGE_SUFFIX}`;
  // Build the compiler native image.
  let pathParts = [TEMP_PATH, `graalvm-ce-java8-${GRAAL_VERSION}`];
  if (GRAAL_OS === "darwin") {
    pathParts.push("Contents", "Home", "bin");
  } else {
    pathParts.push("bin");
  }
  const GRAAL_BIN_FOLDER = path.resolve.apply(null, pathParts);
  if (!fs.existsSync(path.resolve(TEMP_PATH, GRAAL_FOLDER))) {
    const GRAAL_GU_PATH = path.resolve(
      GRAAL_BIN_FOLDER,
      `gu${GRAAL_OS === "windows" ? ".cmd" : ""}`
    );
    buildSteps = buildSteps
      .then(() => {
        // Download graal and extract the contents
        if (!fs.existsSync(path.resolve(TEMP_PATH, GRAAL_ARCHIVE_FILE))) {
          process.stdout.write(`Downloading graal from ${GRAAL_URL}\n`);
          return runCommand(
            `curl --fail --show-error --location --progress-bar --output ${GRAAL_ARCHIVE_FILE} ${GRAAL_URL}`,
            { cwd: TEMP_PATH }
          );
        }
      })
      .then(() => {
        if (GRAAL_PACKAGE_SUFFIX === "tar.gz") {
          return runCommand(`tar -xzf ${GRAAL_ARCHIVE_FILE}`, {
            cwd: TEMP_PATH,
          });
        }
        return runCommand(`7z x -y ${GRAAL_ARCHIVE_FILE}`, { cwd: TEMP_PATH });
      })
      .then(() => runCommand(`${GRAAL_GU_PATH} install native-image`));
  }

  // Build the compiler native image.
  const GRAAL_NATIVE_IMAGE_PATH = path.resolve(
    GRAAL_BIN_FOLDER,
    `native-image${GRAAL_OS === "windows" ? ".cmd" : ""}`
  );

  buildSteps
    .then(() => runCommand(GRAAL_NATIVE_IMAGE_PATH, NATIVE_IMAGE_BUILD_ARGS))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
})();
