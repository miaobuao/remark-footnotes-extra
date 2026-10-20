# Changelog

## 0.3.1

- Separate inline annotation scanning, definition registration, and plugin traversal while preserving the default export and `breakLink` option.
- Fix mixed text, formatting, links, and long citations being left in the document body.
- Balance literal brackets, preserve unclosed annotations, and support empty, code-only, and image-only notes.
- Deduplicate by content structure rather than visible text alone, and avoid collisions with existing footnote identifiers.
- Prevent generated definitions from being transformed again.
- Limit GFM autolink repair to open annotations and preserve explicit link URLs.
- Correct package type exports, ship declaration dependencies, and bundle traversal for CommonJS compatibility.
- Remove Lodash, repair the playground development command, and add regression tests and CI.

The latest npm release before this change was 0.3.0; the GitHub package metadata was still at 0.2.1.
