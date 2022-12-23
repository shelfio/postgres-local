import getDebug from 'debug';
import {exec} from 'child_process';
import postgres from 'postgres';
import {promisify} from 'util';

const asyncExec = promisify(exec);
import cwd from 'cwd';
import {platform} from 'os';

const debug = getDebug('postgres-local');
const FILEPATH_PREFIX = `${cwd()}/node_modules/.cache/@shelf/postgres-local`;

type StartESOptions = {
  seedPath?: string;
  version?: number;
};

export async function start(options: StartESOptions): Promise<string> {
  const {seedPath, version = 14} = options;

  const url = 'postgres://localhost:5432/postgres';

  try {
    await asyncExec(getInstallationScript(version));

    debug('Connecting to postgres...');
    const sql = postgres(url);
    debug('Postgres available!');
    process.env.PSQL = url;

    if (seedPath?.length) {
      debug('Found seed file, seeding...');
      await sql.file(seedPath);
      debug('Seed done available!');
    }

    return url;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function stop(version = 14): Promise<{stdout: string; stderr: string}> {
  return asyncExec(getStopScript(version));
}

export function getInstallationScript(version: number): string {
  switch (platform()) {
    case 'darwin': {
      return `
        brew install postgresql@${version}
        mkdir -p ${FILEPATH_PREFIX}/data;
        initdb -D ${FILEPATH_PREFIX}/data;
        pg_ctl -D ${FILEPATH_PREFIX}/data -l ${FILEPATH_PREFIX}/logfile start;
      `;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return `
        apt-get update
        apt-get install -y postgresql-${version}
        mkdir -p ${FILEPATH_PREFIX}/data;
        /usr/lib/postgresql/${version}/bin/initdb -D ${FILEPATH_PREFIX}/data;
        /usr/lib/postgresql/${version}/bin/pg_ctl -D ${FILEPATH_PREFIX}/data -l ${FILEPATH_PREFIX}logfile start;
      `;
    }
  }
}

export function getStopScript(version = 14): string {
  switch (platform()) {
    case 'darwin': {
      return `
         pg_ctl stop -D ${FILEPATH_PREFIX}/data
         rm -rf ${FILEPATH_PREFIX}
      `;
    }
    default: {
      return `
        /usr/lib/postgresql/${version}/bin/pg_ctl -D ${FILEPATH_PREFIX}/data
        rm -rf ${FILEPATH_PREFIX}
      `;
    }
  }
}
