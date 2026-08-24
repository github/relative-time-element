# Contributing

## Development

Clone the repository from GitHub.

```
$ git clone https://github.com/github/time-elements
```

Now just cd into the directory and run `make` to install the development dependencies.

```
$ cd time-elements/
$ make
```

## Testing

Lint tools and headless tests can be ran via `make`.

```
$ make test
```

The QUnit test suite can also be ran in the browser.

```
$ open test/test.html
```

## Publishing

To publish a new version to npm, [create a GitHub release](https://github.com/github/relative-time-element/releases/new) with the new version tag. If the tag does not exist yet, create it from the release page while creating the release.

Publishing the release automatically triggers the [Publish workflow](https://github.com/github/relative-time-element/actions/workflows/publish.yml), which tests the package and publishes the tagged version to npm.
