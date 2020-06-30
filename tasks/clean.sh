#!/usr/bin/env bash
rm -rf ./temp
rm -rf ./build
rm ./packages/google-closure-compiler-java/compiler.jar
rm ./packages/google-closure-compiler-linux/compiler.jar
rm ./packages/google-closure-compiler-linux/compiler
rm ./packages/google-closure-compiler-osx/compiler.jar
rm ./packages/google-closure-compiler-osx/compiler
./tasks/remove-os-restrictions.js