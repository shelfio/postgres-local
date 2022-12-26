import getDebug from 'debug';
import {spawnSync} from 'child_process';
import postgres from 'postgres';
import cwd from 'cwd';
import {platform} from 'os';

const debug = getDebug('postgres-local');
const MACOS_TEMP_FILEPATH = `${cwd()}/node_modules/.cache/@shelf/postgres-local`;
// const LINUX_TEMP_FILEPATH = '/postgres-local';

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
       mkdir -p ${MACOS_TEMP_FILEPATH}/data;
       initdb -D ${MACOS_TEMP_FILEPATH}/data;
       pg_ctl -D ${MACOS_TEMP_FILEPATH}/data -o "-F -p ${port}" -l ${MACOS_TEMP_FILEPATH}/logfile start;
      `;
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return `
        sudo service postgresql stop;
        apt update;
        apt install postgresql-${version};
        sudo -u postgres mkdir -p ~/postgres-local/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/initdb -D ~/postgres-local/data;
        sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl -o "-F -p ${port}" -D ~/postgres-local/data -l ~/postgres-local/logfile start;
      `;
    }
  }
}

export function getStopScript({version = 14}): string {
  switch (platform()) {
    case 'darwin': {
      return `
         pg_ctl stop -D ${MACOS_TEMP_FILEPATH}/data
         rm -rf ${MACOS_TEMP_FILEPATH}
      `;
    }
    default: {
      return `
        sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl stop -D ~/postgres-local/data
        sudo -u postgres rm -rf ~/postgres-local/
      `;
    }
  }
}
