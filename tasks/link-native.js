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

const { exec } = require("./exec.js");
const { getOsName } = require('./utils.js');

/**
 * Link native binary for the current OS
 **/
(async function () {
  exec(`yarn link --cwd packages/google-closure-compiler-${getOsName()}`);
  exec(`yarn link "@ampproject/google-closure-compiler-${getOsName()}" --cwd packages/google-closure-compiler`);
})();


