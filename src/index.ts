import getDebug from 'debug';
import {spawnSync} from 'child_process';
import postgres from 'postgres';
import {platform} from 'os';

const debug = getDebug('postgres-local');
const PD_TEMP_DATA_PATH = `/tmp/postgres-local-${Date.now()}`;

export async function start(options: {
  seedPath?: string;
  version?: number;
  port?: number;
}): Promise<string> {
  const {seedPath, version = 14, port = 5555} = options;

  const url = `postgres://localhost:${port}/postgres`;

  try {
    await spawnSync(getInstallationScript({version}), {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        HOME: '/root',
      },
    });

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

export function stop({version = 14}: {version?: number; useSudo?: boolean}): any {
  return spawnSync(getStopScript({version}), {
    stdio: 'inherit',
    shell: true,
  });
}

export function getInstallationScript({version = 14, port = 5555}): string {
  switch (platform()) {
    case 'darwin': {
      return `
       brew install postgresql@${version};
       mkdir -p ${PD_TEMP_DATA_PATH}/data;
       initdb -D ${PD_TEMP_DATA_PATH}/data;
       pg_ctl -D ${PD_TEMP_DATA_PATH}/data -o "-F -p ${port}" -l ${PD_TEMP_DATA_PATH}/logfile start;
      `;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return `
        apt update;
        apt install postgresql-${version};
        sudo -u postgres mkdir -p ${PD_TEMP_DATA_PATH}/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/initdb -D ${PD_TEMP_DATA_PATH}/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl -o "-F -p ${port}" -D ${PD_TEMP_DATA_PATH}/data -l ${PD_TEMP_DATA_PATH}/logfile start;
        sudo -u postgres createuser -p ${port} -s $(whoami);
        sudo -u postgres createdb -p ${port} $(whoami);
      `;
    }
  }
}

export function getStopScript({version = 14}): string {
  switch (platform()) {
    case 'darwin': {
      return `
         pg_ctl stop -D ${PD_TEMP_DATA_PATH}/data
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
