This repo is a fork of the official Google Closure Compiler with added configuration for AMP's specific runners.

You can inspect them under the `src` directory.

This is not intended to be used outside the AMP Project, and no support is guaranteed.

If you're looking to use Closure Compiler for your project, here are some great places to get started:

1. https://github.com/ampproject/rollup-plugin-closure-compiler
2. https://github.com/google/closure-compiler-npm

## Local Development Guide

1. Clone this repo (`ampproject/amp-closure-compiler`)
    ```sh
    git clone git@github.com:ampproject/amp-closure-compiler.git
    ```
1. Install packages
    ```sh
    cd amp-closure-compiler
    npm install # This will create node_modules/google-closure-compiler-java/compiler.jar
    ```
1. Clone https://github.com/google/closure-compiler/ (`google/closure-compiler`)
    ```sh
    git clone git@github.com:google/closure-compiler.git
    ```
1. Make your edits to `google/closure-compiler`
1. [Build](https://github.com/google/closure-compiler/#using-bazel) `google/closure-compiler`
1. Link your built `google/closure-compiler` to `amp-closure-compiler`'s `compiler.jar`
    ```sh
    # Run this from your source root directory
    ln -s closure-compiler/bazel-bin/compiler_unshaded_deploy.jar \
    amp-closure-compiler/node_modules/google-closure-compiler-java/compiler.jar
    ```
1. Build `amp-closure-compiler`
    ```sh
    npm run clean
    npm run build
    ```
1. There should now be several built node modules in `amp-closure-compiler`'s `/packages/` directory. You need to link them to them
    ```sh
    for dir in `ls packages/`;
    do;
      cd dir;
      npm link;
      cd ../..;
    done
    ```
1. In `amp-closure-compiler`, you need to link these node modules:
    ```sh
    npm link @ampproject/google-closure-compiler
    npm link google-closure-compiler-java
    npm link google-closure-compiler-java-osx # may fail if you're not on OSX
    npm link google-closure-compiler-java-linux # may fail if you're not on Linux
    npm link google-closure-compiler-java-windows # may fail if you're not on Windows
    ```
