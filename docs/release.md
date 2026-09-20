# Release process

1. Update `module.json`, `package.json`, `scripts/constants.mjs`, and `CHANGELOG.md` to the same Semantic Version.
2. Run `npm run check`.
3. Commit the release on `master`.
4. Run `./dev/build-release.sh` from a clean worktree.
5. Verify `dist/*-SHA256SUMS.txt`.
6. Verify the documentation ZIP does **not** contain `module.json`.
7. Install the generated runtime ZIP into a clean test instance before publishing.

The build produces:

- installable module ZIP;
- complete source ZIP, including `.git` history;
- documentation ZIP containing project documentation but no `module.json`;
- SHA-256 checksum file.
