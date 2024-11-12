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
dbdocs/0.3.1 linux-x64 node-v12.16.1
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
* [`dbdocs password`](#dbdocs-password)
* [`dbdocs remove [PROJECT_NAME]`](#dbdocs-remove-project_name)

## `dbdocs build [FILEPATH]`

build docs

```
USAGE
  $ dbdocs build [FILEPATH]

ARGUMENTS
  FILEPATH  dbml file path

OPTIONS
  -p, --password=password  password for project
  --project=project        project name
```

_See code: [src/commands/build.js](https://github.com/holistics/dbdocs/blob/v0.3.1/src/commands/build.js)_

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

_See code: [src/commands/login.js](https://github.com/holistics/dbdocs/blob/v0.3.1/src/commands/login.js)_

## `dbdocs logout`

logout

```
USAGE
  $ dbdocs logout

DESCRIPTION
  clears local login credentials
```

_See code: [src/commands/logout.js](https://github.com/holistics/dbdocs/blob/v0.3.1/src/commands/logout.js)_

## `dbdocs password`

set password for your project or remove password

```
USAGE
  $ dbdocs password

OPTIONS
  -p, --project=project name  project name
  -r, --remove                remove password from your project
  -s, --set=password          password for your project
```

_See code: [src/commands/password.js](https://github.com/holistics/dbdocs/blob/v0.3.1/src/commands/password.js)_

## `dbdocs remove [PROJECT_NAME]`

remove docs

```
USAGE
  $ dbdocs remove [PROJECT_NAME]

ARGUMENTS
  PROJECT_NAME  name of the project which you want to remove
```

_See code: [src/commands/remove.js](https://github.com/holistics/dbdocs/blob/v0.3.1/src/commands/remove.js)_
<!-- commandsstop -->
