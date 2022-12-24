import getDebug from 'debug';
import {exec} from 'child_process';
import postgres from 'postgres';
import {promisify} from 'util';

const asyncExec = promisify(exec);
import cwd from 'cwd';
import {platform} from 'os';

const debug = getDebug('postgres-local');
const FILEPATH_PREFIX = `${cwd()}/node_modules/.cache/@shelf/postgres-local`;

export async function start(options: {
  seedPath?: string;
  version?: number;
  useSudo?: boolean;
}): Promise<string> {
  const {seedPath, version = 14, useSudo = false} = options;

  const url = 'postgres://localhost:5432/postgres';

  try {
    await asyncExec(getInstallationScript({version, useSudo}));

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

export async function stop({
  version = 14,
  useSudo = false,
}: {
  version?: number;
  useSudo?: boolean;
}): Promise<{stdout: string; stderr: string}> {
  return asyncExec(getStopScript({version, useSudo}));
}

export function getInstallationScript({version = 14, useSudo = false}): string {
  const prefix = useSudo ? 'sudo' : '';
  switch (platform()) {
    case 'darwin': {
      return `
        ${prefix} brew install postgresql@${version};
        ${prefix} mkdir -p ${FILEPATH_PREFIX}/data;
        ${prefix} initdb -D ${FILEPATH_PREFIX}/data;
        ${prefix} pg_ctl -D ${FILEPATH_PREFIX}/data -l ${FILEPATH_PREFIX}/logfile start;
      `;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return `
        ${prefix} apt update;
        ${prefix} apt install postgresql-${version};
        ${prefix} mkdir -p ${FILEPATH_PREFIX}/data;
        ${prefix} /usr/lib/postgresql/${version}/bin/initdb -D ${FILEPATH_PREFIX}/data;
        ${prefix} /usr/lib/postgresql/${version}/bin/pg_ctl -D ${FILEPATH_PREFIX}/data -l ${FILEPATH_PREFIX}logfile start;
      `;
    }
  }
}

export function getStopScript({version = 14, useSudo = false}): string {
  const prefix = useSudo ? 'sudo' : '';
  switch (platform()) {
    case 'darwin': {
      return `
         ${prefix} pg_ctl stop -D ${FILEPATH_PREFIX}/data
         ${prefix} rm -rf ${FILEPATH_PREFIX}
      `;
    }
    default: {
      return `
        ${prefix} /usr/lib/postgresql/${version}/bin/pg_ctl -D ${FILEPATH_PREFIX}/data
        ${prefix} rm -rf ${FILEPATH_PREFIX}
      `;
    }
  }
}
