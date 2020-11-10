This repo is a fork of the official Google Closure Compiler with added configuration for AMP's specific runners.

You can inspect them under the `src` directory.

This is not intended to be used outside the AMP Project, and no support is guaranteed.

If you're looking to use Closure Compiler for your project, here are some great places to get started:
1. https://github.com/ampproject/rollup-plugin-closure-compiler
2. https://github.com/google/closure-compiler-npm

## How to build custom compilers

1. Clone this repo (referred to as ACC)
1. `cd` into ACC, and `npm install`
   - This will create a `node_modules/google-closure-compiler-java/compiler.jar`
1. Clone https://github.com/google/closure-compiler/ (referred to as GCC)
1. Make your edits to GCC
1. [Build GCC](https://github.com/google/closure-compiler/#using-bazel)
1. Link your built GCC to ACC's `compiler.jar`
   - `ln -s PATH_TO_GCC/bazel-bin/compiler_unshaded_deploy.jar PATH_TO_ACC/node_modules/google-closure-compiler-java/compiler.jar`
1. Build ACC
  - `npm run clean; npm run build`
1. There should now be several built node modules in ACC's `/packages/`.  You need to run `npm link` on them
  - ```for dir in `ls packages/`; do; cd dir; npm link; cd ../..; done ```
1. In the AMP repo, you need to link these node modules:
  - `npm link @ampproject/google-closure-compiler`
  - `npm link google-closure-compiler-java`
  - `npm link google-closure-compiler-java-osx` (may fail if you're not on OSX)
  - `npm link google-closure-compiler-java-linux` (may fail if you're not on Linux)
  - `npm link google-closure-compiler-java-windows` (may fail if you're not on Windows)
