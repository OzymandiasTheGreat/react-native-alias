# react-native-alias

Metro, the de facto bundler of React-Native, notoriously didn't support aliases. That has changed with recent versions, but it's
not particularly well advertised, leading most devs to rely on outdated hacks for things like node integration.

This module/cli app aims to fix that.

```plaintext
Usage: react-native-alias [options] [command]

Options:
  -h, --help                        display help for command

Commands:
  alias [options] <module:shim...>  Add alias for given module:shim pairs
  unalias [options] <modules...>    Remove previously added alias
  node [options] [modules...]       Use a well known shim to shim builtin node modules
  help [command]                    display help for command
```

Just run `npx react-native-alias unsupported-module:replacement-module` in the root of your React-Native project and that's it! Note that Metro sometimes fails to apply aliases, in that case re-run this command with `--babel` option to also add Babel alias via `babel-plugin-module-resolver` and carry on.

If you just want to run npm packages meant for node, react-native-alias includes a convenience command and a list of
known shims to speed things up.

Run `react-native-alias node buffer stream <any other built in modules ...>` and react-native-alias will install shims and setup configuration for you. Or run `react-native-alias node --all`
to install shims for every node builtin module available.

## Wait, doesn't rn-nodeify already do this?

Short answer, no. Long answer:
rn-nodeify predates relevant Metro config options and `babel-plugin-module-resolver` and therefor relies on dirty
hacks to do it's job. It also goes above and beyond what this module does in really unsafe ways and therefor is a great way
to bork your project. 60% of the time it works every time.
rn-nodeify also didn't check it's shims for validity before inclusion and while most of them work there are a couple of broken
ones. And finally rn-nodeify install very old versions of shims
making your code outdated and insecure.

I tried to use rn-nodeify myself, but after multiple failures I've
been settings shims and aliases manually. While that works,
I figured it's time I automated things.

## There's a catch tho

If your module doesn't work even after shimming relevant node modules, it's likely they turn off features through package.json browser field. rn-nodeify handles some of these cases and misses others. I figured it's a better idea to edit offending packages' package.json manually and use `patch-package`. Far less breakage this way.

If you do find a package who's package.json needs editing, edit it to a functional state, generate a path with `patch-package --exclude nothing`,
clone this repo, place the generated patch in patches directory and submit a pull request :)
