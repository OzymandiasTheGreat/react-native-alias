# react-native-alias

Create Webpack like alias in React-Native.
Sugar for Metro config option `extraNodeModules` and `babel-plugin-module-resolver`.
Automatically installs shims.
Contains a list of known shims for builtin node modules.

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
