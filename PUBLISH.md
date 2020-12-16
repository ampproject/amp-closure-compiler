## Publishing a new version of `@ampproject/amp-closure-compiler`

Sync latest changes from `origin`.

```
git pull
```

Run tests locally and make sure they pass.
```
npm run test
```

Publish a new version for each package. (Use `--dry-run` to preview results without actually publishing.)
```
for package in `ls packages/`;
do npm publish --access public --otp <OTP> packages/$package [--dry-run];
done
```
