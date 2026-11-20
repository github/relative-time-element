# Contributing

## Development

Use Node.js 24 LTS, the same version used by CI and publishing.

Clone the repository from GitHub.

```
$ git clone https://github.com/github/relative-time-element
```

Now cd into the directory and install the development dependencies.

```
$ cd relative-time-element/
$ npm ci
$ npx playwright install chromium
```

## Testing

Run lint tools, build the package, and run the headless browser tests.

```
$ npm test
```

## Publishing

To publish a new version to npm, [create a GitHub release](https://github.com/github/relative-time-element/releases/new) with the new version tag. If the tag does not exist yet, create it from the release page while creating the release.

Publishing the release automatically triggers the [Publish workflow](https://github.com/github/relative-time-element/actions/workflows/publish.yml), which tests the package and publishes the tagged version to npm.
