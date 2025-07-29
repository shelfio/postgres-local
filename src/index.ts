import {execSync} from 'child_process';
import {platform} from 'os';
import getDebug from 'debug';
import postgres from 'postgres';
import type {ExecSyncOptions} from 'child_process';

const debug = getDebug('postgres-local');
const PD_TEMP_DATA_PATH = `/tmp/postgres-local`;

export async function start(options: {
  seedPath?: string;
  version?: number;
  port?: number;
  includeInstallation?: boolean;
  debugMode: boolean;
}): Promise<string> {
  const {
    seedPath,
    version = 17,
    port = 5555,
    includeInstallation = false,
    debugMode = false,
  } = options;

  const execOptions: ExecSyncOptions = {};

  if (debugMode) {
    execOptions.stdio = 'inherit';
  }

  const url = `postgres://localhost:${port}/postgres`;

  try {
    execSync(getInstallationScript({version, port, includeInstallation}), execOptions);

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
    stop(options);
    throw e;
  }
}

export function stop({
  version = 17,
  debugMode = false,
}: {
  version?: number;
  debugMode: boolean;
}): void {
  const execOptions: ExecSyncOptions = {};

  if (debugMode) {
    execOptions.stdio = 'inherit';
  }
  execSync(getStopScript({version}), execOptions);
}

export function getInstallationScript({
  version = 17,
  port = 5555,
  includeInstallation: includeInstallation = false,
}): string {
  switch (platform()) {
    case 'darwin': {
      const installation = includeInstallation ? `brew install postgresql@${version};` : '';

      return `
       ${installation}
       mkdir -p ${PD_TEMP_DATA_PATH}/data;
       initdb-${version} -D ${PD_TEMP_DATA_PATH}/data;
       pg_ctl-${version} -D ${PD_TEMP_DATA_PATH}/data -o "-F -p ${port}" -l ${PD_TEMP_DATA_PATH}/logfile start;
      `;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      // eslint-disable-next-line
      const installation = includeInstallation ? `sudo apt update; sudo apt install postgresql-${version};` : '';

      return `
        ${installation}
        sudo -u postgres mkdir -p ${PD_TEMP_DATA_PATH}/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/initdb -D ${PD_TEMP_DATA_PATH}/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl -o "-F -p ${port}" -D ${PD_TEMP_DATA_PATH}/data -l ${PD_TEMP_DATA_PATH}/logfile start;
        sudo -u postgres createuser -p ${port} -s $(whoami);
        sudo -u postgres createdb -p ${port} $(whoami);
      `;
    }
  }
}

export function getStopScript({version = 17}): string {
  switch (platform()) {
    case 'darwin': {
      return `
         pg_ctl-${version} stop -D ${PD_TEMP_DATA_PATH}/data
         rm -rf ${PD_TEMP_DATA_PATH}
      `;
    }
    default: {
      return `
        sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl stop -D ${PD_TEMP_DATA_PATH}/data
        sudo -u postgres rm -rf ${PD_TEMP_DATA_PATH}
      `;
    }
  }
}
