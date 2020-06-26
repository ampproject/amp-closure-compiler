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
 * @fileoverview Tests for gulp-google-closure-compiler plugin
 *
 * @author Chad Killingsworth (chadkillingsworth@gmail.com)
 */

'use strict';

const assert = require('stream-assert');
const should = require('should');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const File = require('vinyl');
const compilerPackage = require('../');
const ClosureCompiler = require('../lib/node/closure-compiler');
const streamFilter = require('gulp-filter');

require('mocha');

process.on('unhandledRejection', e => { throw e; });

describe('gulp-google-closure-compiler', function() {
  let originalCompilerRunMethod;
  let originalJsCompilerRunMethod;
  let platformUtilized;

  before(() => {
    originalCompilerRunMethod = Object.getOwnPropertyDescriptor(ClosureCompiler.prototype, 'run');
    Object.defineProperty(ClosureCompiler.prototype, 'run', {
      value: function(...args) {
        const retVal = originalCompilerRunMethod.value.apply(this, args);
        platformUtilized = /^java/.test(this.getFullCommand()) ? 'java' : 'native';
        return retVal;
      },
      writable: true,
      enumerable: false,
      configurable: true
    });
  });

  after(() => {
    Object.defineProperty(ClosureCompiler.prototype, 'run', originalCompilerRunMethod);
  });

  ['java', 'native'].forEach(platform => {
    describe(`${platform} version`, function() {
      const closureCompiler = compilerPackage.gulp();

      this.timeout(30000);
      this.slow(10000);

      const fakeFile1 = new File({
        path: '/foo.js',
        contents: Buffer.from('console.log("foo");')
      });
      const fakeFile2 = new File({
        path: '/bar.js',
        contents: Buffer.from('console.log("bar");')
      });

      const fixturesCompiled = 'function log(a){console.log(a)}log("one.js");' +
          'var WindowInfo=function(){this.props=[]};WindowInfo.prototype.propList=function(){' +
          'for(var a in window)this.props.push(a)};WindowInfo.prototype.list=function(){' +
          'log(this.props.join(", "))};(new WindowInfo).list();\n';

      afterEach(() => {
        if (platformUtilized) {
          should.equal(platform, platformUtilized);
        }
        platformUtilized = undefined;
      });

      it('should emit an error for invalid flag', done => {
        const stream = closureCompiler({
          foo: 'BAR'
        }, {
          platform
        });

        stream.on('error', err => {
          err.message.should.match(/^(gulp-google-closure-compiler: )?Compilation error/);
          done();
        });
        stream.write(fakeFile1);
        stream.end();
      });

      it('should emit an error for a flag with an invalid value', done => {
        const stream = closureCompiler({
          compilation_level: 'FOO'
        }, {
          platform
        });

        stream.on('error', err => {
          err.message.should.match(/^(gulp-google-closure-compiler: )?Compilation error/);
          done();
        });
        stream.write(fakeFile1);
        stream.end();
      });

      it('should compile a single file', done => {
        const stream = closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE'
        }, {
          platform
        });

        stream.pipe(assert.length(1))
          .pipe(assert.first(f => {
            f.contents.toString().trim().should.eql(fakeFile1.contents.toString());
          }))
          .pipe(assert.end(done));

        stream.write(fakeFile1);
        stream.end();
      });

      it('should name the output file when no js_output_file option is provided', done => {
        const stream = closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE'
        }, {
          platform
        });
        stream.pipe(assert.length(1))
          .pipe(assert.first(f => {
            f.path.should.eql('compiled.js');
          }))
          .pipe(assert.end(done));

        stream.write(fakeFile1);
        stream.end();
      });

      it('should name the output file from the js_output_file option', done => {
        const stream = closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE',
          js_output_file: 'out.js'
        }, {
          platform
        });
        stream.pipe(assert.length(1))
          .pipe(assert.first(f => {
            f.path.should.eql('out.js');
          }))
          .pipe(assert.end(done));

        stream.write(fakeFile1);
        stream.end();
      });

      it('should compile multiple input files into a single output', done => {
        const stream = closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE'
        }, {
          platform
        });

        stream.pipe(assert.length(1))
          .pipe(assert.first(f => {
            f.contents.toString().trim().should.eql(fakeFile1.contents.toString() +
                fakeFile2.contents.toString());
          }))
          .pipe(assert.end(done));

        stream.write(fakeFile1);
        stream.write(fakeFile2);
        stream.end();
      });

      it('should compile multiple inputs into multiple outputs with chunk options', done => {
        const stream = closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE',
          chunk: [
            'one:1',
            'two:1'
          ],
          createSourceMap: true
        }, {
          platform
        });

        // The compiler outputs a file named $weeak$.js which is empty.
        // It's used to hold weak dependency that were imported for type information only.
        // Exclude it from test assertions.
        stream
            .pipe(streamFilter(['**', '!**/$weak$.js']))
            .pipe(assert.length(2))
            .pipe(assert.first(f => {
              f.contents.toString().trim().should.eql(fakeFile1.contents.toString());
              f.path.should.eql('one.js');
            }))
            .pipe(assert.second(f => {
              f.contents.toString().trim().should.eql(fakeFile2.contents.toString());
              f.path.should.eql('two.js');
            }))
            .pipe(assert.end(done));

        stream.write(fakeFile1);
        stream.write(fakeFile2);
        stream.end();
      });

      it('should generate a sourcemap for a single output file', done => {
        gulp.src('test/fixtures/**/*.js', {base: './'})
          .pipe(sourcemaps.init())
          .pipe(closureCompiler({
            compilation_level: 'SIMPLE',
            warning_level: 'VERBOSE'
          }, {
            platform
          }))
          .pipe(assert.length(1))
          .pipe(assert.first(f => {
            f.sourceMap.sources.should.have.length(2);
            f.sourceMap.file.should.eql('compiled.js');
          }))
          .pipe(assert.end(done));
      });

      it('should generate a sourcemap for each output file with chunks', done => {
        gulp.src([__dirname + '/fixtures/one.js', __dirname + '/fixtures/two.js'])
            .pipe(sourcemaps.init())
            .pipe(closureCompiler({
              compilation_level: 'SIMPLE',
              warning_level: 'VERBOSE',
              chunk: [
                'one:1',
                'two:1:one'
              ],
              createSourceMap: true
            }, {
              debugLog: true,
              platform
            }))
            // The compiler outputs a file named $weeak$.js which is empty.
            // It's used to hold weak dependency that were imported for type information only.
            // Exclude it from test assertions.
            .pipe(streamFilter(['**', '!**/$weak$.js']))
            .pipe(assert.length(2))
            .pipe(assert.first(f => {
              f.sourceMap.sources.should.have.length(1);
              f.sourceMap.file.should.eql('./one.js');
            }))
            .pipe(assert.second(f => {
              f.sourceMap.sources.should.have.length(1);
              f.sourceMap.file.should.eql('./two.js');
            }))
            .pipe(assert.end(done));
      });

      if (platform !== 'javascript') {
        it('should support passing input globs directly to the compiler', done => {
          const stream = closureCompiler({
            js: __dirname + '/fixtures/**.js',
            compilation_level: 'SIMPLE',
            warning_level: 'VERBOSE'
          }, {
            platform
          })
            .src()
            .pipe(assert.length(1))
            .pipe(assert.first(f => {
              f.contents.toString().should.eql(fixturesCompiled);
            }))
            .pipe(assert.end(done));
        });

        it('should include js options before gulp.src files', done => {
          gulp.src(__dirname + '/fixtures/two.js')
            .pipe(closureCompiler({
              js: __dirname + '/fixtures/one.js',
              compilation_level: 'SIMPLE',
              warning_level: 'VERBOSE'
            }, {
              platform
            }))
            .pipe(assert.length(1))
            .pipe(assert.first(f => {
              f.contents.toString().should.eql(fixturesCompiled);
            }))
            .pipe(assert.end(done));
        });

        it('should support calling the compiler with an arguments array', done => {
          const stream = closureCompiler([
            '--js="' + __dirname + '/fixtures/**.js"',
            '--compilation_level=SIMPLE',
            '--warning_level=VERBOSE'
          ], {
            platform
          })
            .src()
            .pipe(assert.length(1))
            .pipe(assert.first(f => {
              f.contents.toString().should.eql(fixturesCompiled);
            }))
            .pipe(assert.end(done));
        });

        it('should compile without gulp.src files when .src() is called', done => {
          closureCompiler({
            compilation_level: 'SIMPLE',
            warning_level: 'VERBOSE',
            js: __dirname + '/fixtures/**.js'
          }, {
            platform
          })
            .src()
            .pipe(assert.length(1))
            .pipe(assert.first(f => {
              f.contents.toString().should.eql(fixturesCompiled);
            }))
            .pipe(assert.end(done));
        });
      }

      it('should generate no output without gulp.src files', done => {
        gulp.src('test/does-not-exist.js', {allowEmpty: true})
          .pipe(closureCompiler({
            compilation_level: 'SIMPLE',
            warning_level: 'VERBOSE'
          }, {
            platform
          }))
          .pipe(assert.length(0))
          .pipe(assert.end(done));
      });

      it('should properly compose sourcemaps when multiple transformations are chained', done => {
        gulp.src(['test/fixtures/one.js', 'test/fixtures/two.js'], {base: './'})
          .pipe(sourcemaps.init())
          .pipe(closureCompiler({
            compilation_level: 'WHITESPACE_ONLY',
            warning_level: 'VERBOSE',
            formatting: 'PRETTY_PRINT',
            sourceMapIncludeContent: true
          }, {
            platform
          }))
          .pipe(closureCompiler({
            compilation_level: 'SIMPLE',
            warning_level: 'QUIET',
            formatting: 'PRETTY_PRINT',
            js_output_file: 'final.js',
            sourceMapIncludeContent: true
          }, {
            platform
          }))
          .pipe(assert.first(f => {
            f.sourceMap.sources.should.containEql('test/fixtures/one.js');
            f.sourceMap.sources.should.containEql('test/fixtures/two.js');
          }))
          .pipe(assert.end(done))
          .on('error', err => {
            console.error(err);
          });
      });

      it('in streaming mode should emit an error', done => {
        gulp.src(__dirname + '/fixtures/**/*.js', {buffer: false})
          .pipe(closureCompiler({
            compilation_level: 'SIMPLE',
            warning_level: 'VERBOSE'
          }, {
            platform
          }))
          .on('error', err => {
            err.message.should.match(/^(gulp-google-closure-compiler: )?Streaming not supported/);
            done();
          });
      });
    });
  });
});
