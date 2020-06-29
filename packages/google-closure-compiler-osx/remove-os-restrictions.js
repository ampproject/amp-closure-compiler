#!/usr/bin/env node
/*
 * Copyright 2018 The Closure Compiler Authors.
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
'use strict';
/**
 * @fileoverview
 *
 * Before publication, add OS restrictions to the graal packages.
 * They can't be present before publication as it errors out the installs.
 */

const {promises: fs} = require('fs');
const path = require('path');

(async function() {
  const packagePath = path.resolve(__dirname, 'package.json');
  const packageContents = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  delete packageContents.os;
  await fs.writeFile(packagePath, JSON.stringify(packageContents, null, 2) + '\n', 'utf8');
})();
