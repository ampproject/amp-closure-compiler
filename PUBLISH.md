1. Make sure `git lfs` is installed. `git lfs install`.
2. Pull the latest files `git lfs pull`. 
3. Ensure tests `yarn test` pass.
4. Run restriction task (adds os restrictions per OS optional dependency) `yarn restrict`.
5. Run `node_modules/.bin/lerna version --force-publish='*'`.
6. Run `npm publish --otp={}` in each package. (TODO: Fix this please.)

NOTE: When complete, run `yarn clean` to ensure `restrict` isn't applied to source.