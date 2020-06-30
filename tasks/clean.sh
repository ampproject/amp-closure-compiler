#!/usr/bin/env bash
rm -rf ./temp
rm -rf ./build
rm ./packages/google-closure-compiler-java/compiler.jar
rm ./packages/google-closure-compiler-linux/compiler.jar
rm ./packages/google-closure-compiler-linux/compiler
rm ./packages/google-closure-compiler-osx/compiler.jar
rm ./packages/google-closure-compiler-osx/compiler
./packages/google-closure-compiler-osx/remove-os-restrictions.js
./packages/google-closure-compiler-linux/remove-os-restrictions.js