# Maintaining

## Releasing a new version

This project follows [semver](http://semver.org/). So if you are making a bug
fix, only increment the patch level "1.0.x". If any new files are added, a
minor version "1.x.x" bump is in order.

### Make a release commit

To prepare the release commit, edit the
[bower.json](https://github.com/github/time-elements/blob/master/bower.json)
`version` value. Then make a single commit with the description as
"Time Elements 1.x.x". Finally, tag the commit with `v1.x.x`.

```
$ git pull
$ vim bower.json
$ git add bower.json
$ git ci -m "Time Elements 1.x.x"
$ git tag v1.x.x
$ git push
$ git push --tags
```
