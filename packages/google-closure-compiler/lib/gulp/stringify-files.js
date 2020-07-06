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

"use strict";

const path = require("path");
const stringifyCache = new Map();

/**
 * @param {Array<Object>} files
 * @return {string}
 */
module.exports = (files) => {
  if (files.length < 1) {
    return '[]';
  }

  let output = "[";
  for (const file of files) {
    const filePath = file.relative || path.relative(process.cwd(), file.path);

    if (stringifyCache.has(filePath)) {
      output += stringifyCache.get(filePath) + ",";
      continue;
    }

    const fileValue = {
      src: file.contents.toString(),
      path: filePath,
    };
    if (file.sourceMap) {
      fileValue.sourceMap = JSON.stringify(file.sourceMap);
    }
    stringifyCache.set(filePath, JSON.stringify(fileValue));
    output += stringifyCache.get(filePath) + ",";
  }

  output = output.substring(0, output.length - 1) + "]";
  return output;
};
