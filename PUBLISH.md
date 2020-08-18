## Publishing a new version of `@ampproject/amp-closure-compiler`

Sync latest changes from `origin`.

```
git pull
```

Run tests locally and make sure they pass.
```
yarn test
```

Bump versions of all local packages (select an appropriate incremental version) and push a new tag. Push to `upstream` if you're working on a fork.
```
npx lerna version --exact --force-publish='*' [--git-remote upstream]
```

Publish a new version for each package. (Use `--dry-run` to preview results without actually publishing.)
```
for package in `ls packages/`;
do npm publish --access public --otp <OTP> packages/$package [--dry-run];
done
```
