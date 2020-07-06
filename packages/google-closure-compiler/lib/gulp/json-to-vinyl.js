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
'use strict';

const File = require('vinyl');

/**
 * @param {string} input string of json encoded files
 * @return {Array<Object>}
 */
module.exports = fileList => {
  let outputFiles = [];
  for (const file of fileList) {
    const newFile = new File({
      path: file.path,
      contents: Buffer.from(file.src)
    });
    if (file.source_map || file.sourceMap) {
      newFile.sourceMap = JSON.parse(file.source_map || file.sourceMap);
    }
    outputFiles.push(newFile);
  }

  return outputFiles;
};

