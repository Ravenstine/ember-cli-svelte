Changelog
===========
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2022-07-20
### Added
- Allow use of Svelte components as route templates
- Support invoking Ember components within Svelte components
- Provide API for lookups etc.
### Modified
- Replace document fragment hack with direct Glimmer integration for default slot
- Replace AST transformation in favor of a runtime approach
- Fix bug in the build process that could cause file to be written to the actual project directory
- Add Svelte as a separate dependency during add-on install
- Dropped support for

## [0.1.1] - 2022-07-01
### Modified
- Fixed regression preventing tagless component rendering
- Use AST transformation to generate code instead of string interpolation

## [0.1.0] - 2022-06-29
### Added
- Default slot support (passing a block from Glimmer to Svelte)
- Allowing Svelte components to import other Svelte components
### Removed
- Requirement for a wrapping DOM element

## [0.0.1] - 2022-06-26
### Added
- Basic Svelte component support, including invocation and forwarding dynamic properties

[Unreleased]: https://github.com/ravenstine/ember-cli-svelte/compare/v0.0.1...HEAD
[0.2.0]: https://github.com/ravenstine/ember-cli-svelte/releases/tag/v0.2.0
[0.0.1]: https://github.com/ravenstine/ember-cli-svelte/releases/tag/v0.1.1
[0.0.1]: https://github.com/ravenstine/ember-cli-svelte/releases/tag/v0.0.1
