jest.setTimeout(10 * 60 * 1000);
import cwd from 'cwd';
import postgres from 'postgres';
import {start, stop} from '.';

describe('#postgres', () => {
  // The order of tests matters here
  // since plugin should clean up files and rerun correctly even after error occurred after start

  it('should stop postgres and clear files locally if error occurred during start', async () => {
    try {
      await start({
        version: 12,
        debugMode: true,
        seedPath: `${cwd()}/src/notExists.sql`,
      });
    } catch (e) {
      // @ts-ignore
      expect(e.name).toEqual('Error');
    }
  });

  it('should start postgres locally', async () => {
    expect.assertions(2);

    const returnedUrl = await start({
      seedPath: `${cwd()}/src/schema.sql`,
      version: 12,
      includeInstallation: false,
      debugMode: true,
    });

    const sql = postgres(returnedUrl);

    const data = await sql`
      SELECT attname, format_type(atttypid, atttypmod)
      FROM pg_catalog.pg_attribute
      WHERE attrelid = 'test.model1'::regclass
      AND attnum > 0
      AND NOT attisdropped;
    `;

    expect(data).toEqual([
      {
        attname: 'id',
        format_type: 'character varying(36)',
      },
      {
        attname: 'type',
        format_type: 'text',
      },
      {
        attname: 'text',
        format_type: 'text',
      },
      {
        attname: 'vector',
        format_type: 'double precision[]',
      },
      {
        attname: 'json',
        format_type: 'jsonb',
      },
      {
        attname: 'updated_at',
        format_type: 'timestamp without time zone',
      },
      {
        attname: 'somebool',
        format_type: 'boolean',
      },
    ]);
    expect(returnedUrl).toEqual('postgres://localhost:5555/postgres');
  });

  it('should stop postgres locally', async () => {
    await stop({
      version: 12,
      debugMode: true,
    });
    try {
      const sql = postgres('postgres://localhost:5555/postgres');

      await sql`create schema supertest`;
    } catch (e) {
      // @ts-ignore
      expect(e.name).toEqual('Error');
    }
  });
});
