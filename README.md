# postgres-local [![CircleCI](https://circleci.com/gh/shelfio/postgres-local/tree/master.svg?style=svg)](https://circleci.com/gh/shelfio/postgres-local/tree/master) ![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg) [![npm (scoped)](https://img.shields.io/npm/v/@shelf/postgres-local.svg)](https://www.npmjs.com/package/@shelf/postgres-local)

> Run any version of Postgres locally

## Usage

### 0. Install

```
$ yarn add @shelf/postgres-local --dev
```

### 1. Start Postgres

```js
import {start} from '@shelf/postgres-local';

await start({
  seedPath: "schema.sql",
  version: 14
});
```

### 2. Stop Postgres

```js
import {stop} from '@shelf/postgres-local';

await stop(14);
```

## Publish

```sh
$ git checkout master
$ yarn version
$ yarn publish
$ git push origin master --tags
```

## License

MIT © [Shelf](https://shelf.io)
