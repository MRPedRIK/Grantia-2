import pg from 'pg';
export const pool = new pg.Pool({max: 10});
