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
  version?: string;
};

export async function start(options: StartESOptions): Promise<string> {
  const {seedPath, version = '14'} = options;

  const url = 'postgres://localhost:5432/postgres';

  try {
    await asyncExec(`
          ${getInstallationScript(version)}
          mkdir ${FILEPATH_PREFIX}/data;
          initdb -D ${FILEPATH_PREFIX}/data;
          pg_ctl -D ${FILEPATH_PREFIX}/data -l logfile start;
        `);

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

export async function stop(): Promise<{stdout: string; stderr: string}> {
  return asyncExec(`
      pg_ctl stop -D ${FILEPATH_PREFIX}/data
      rm -rf ${FILEPATH_PREFIX}
  `);
}

export function getInstallationScript(version: string): string {
  switch (platform()) {
    case 'darwin': {
      return `brew install postgresql@${version}`;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return `
        apt-get update
        apt-get install -y postgresql-${version}
      `;
    }
  }
}
