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
'use strict';
/**
 * @fileoverview
 *
 * Check to see if the graal native image for this platform should be built
 */

const fs = require('fs');
const path = require('path');
const kleur = require('kleur');
const {spawn} = require('child_process');

if (fs.existsSync(path.resolve(__dirname, 'compiler'))) {
  process.stdout.write(kleur.dim('  google-closure-compiler-windows binary already exists\n'));
  process.exit(0);
} else if (process.platform !== 'win32') {
  process.stdout.write(kleur.dim('  google-closure-compiler-windows build wrong platform\n'));
  process.exit(0);
} else {
  process.stdout.write(kleur.dim('  google-closure-compiler-windows building image\n'));
  spawn('node ../../tasks/build-native-compiler.js', [], {shell: 'cmd', stdio: 'inherit'});
}
