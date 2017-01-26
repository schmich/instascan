# Publishing a Release

- `git pull` to ensure you're synced with origin
- Bump version number in `package.json` to `x.y.z`
- `git commit` final changes
- `git tag -s x.y.z -m 'Release x.y.z.'` to create a release tag
- `git push && git push --tags` to push changes and release tag
- `npm publish` to publish new version
- [Create release notes on GitHub](https://github.com/schmich/instascan/releases)
