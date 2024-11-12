dbdocs
======



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/dbdocs.svg)](https://npmjs.org/package/dbdocs)
[![Downloads/week](https://img.shields.io/npm/dw/dbdocs.svg)](https://npmjs.org/package/dbdocs)
[![License](https://img.shields.io/npm/l/dbdocs.svg)](https://github.com/holistics/dbdocs/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g dbdocs
$ dbdocs COMMAND
running command...
$ dbdocs (-v|--version|version)
dbdocs/0.1.0 linux-x64 node-v12.14.1
$ dbdocs --help [COMMAND]
USAGE
  $ dbdocs COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`dbdocs build [FILEPATH]`](#dbdocs-build-filepath)
* [`dbdocs help [COMMAND]`](#dbdocs-help-command)
* [`dbdocs login`](#dbdocs-login)
* [`dbdocs logout`](#dbdocs-logout)

## `dbdocs build [FILEPATH]`

build docs

```
USAGE
  $ dbdocs build [FILEPATH]

ARGUMENTS
  FILEPATH  dbml file path

OPTIONS
  -p, --project=project  project name
```

_See code: [src/commands/build.js](https://github.com/holistics/dbdocs/blob/v0.1.0/src/commands/build.js)_

## `dbdocs help [COMMAND]`

display help for dbdocs

```
USAGE
  $ dbdocs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `dbdocs login`

login to dbdocs

```
USAGE
  $ dbdocs login

DESCRIPTION
  login with your dbdocs credentials
```

_See code: [src/commands/login.js](https://github.com/holistics/dbdocs/blob/v0.1.0/src/commands/login.js)_

## `dbdocs logout`

logout

```
USAGE
  $ dbdocs logout

DESCRIPTION
  clears local login credentials
```

_See code: [src/commands/logout.js](https://github.com/holistics/dbdocs/blob/v0.1.0/src/commands/logout.js)_
<!-- commandsstop -->
