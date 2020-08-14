1. Make sure `git lfs` is installed. `git lfs install`.
2. Pull the latest files `git lfs pull`. 
3. Ensure tests `yarn test` pass.
5. Run `node_modules/.bin/lerna version --force-publish='*'`.
6. Run `npm publish --otp={}` in each package. (TODO: Fix this please.)
