## Publishing a new version of `@ampproject/amp-closure-compiler`

Sync latest changes from `origin`.

```
git pull
```

Run tests locally and make sure they pass.
```
yarn test
```

Bump versions of all local packages (select an appropriate incremental version).
```
npx lerna version --exact --force-publish='*'
```

Publish a new version for each package. (TODO: Make this a single invocation.)
```
npm publish --access public --otp <OTP> packages/google-closure-compiler
npm publish --access public --otp <OTP> packages/google-closure-compiler-java
npm publish --access public --otp <OTP> packages/google-closure-compiler-linux
npm publish --access public --otp <OTP> packages/google-closure-compiler-osx
npm publish --access public --otp <OTP> packages/google-closure-compiler-windows
```
