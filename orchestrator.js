'use strict';
const connection = require('./connection').connection;
const utils = require('./utils');
const logTime = utils.logTime;
const encounterMover = require('./encounter');
const locationMover = require('./location');
const createDummies = require('./dummy-user-provider');
const personCopier = require('./person');
const config = require('./config');


async function orchestration() {
    let startTime = Date.now();
    let dryRun = process.argv.some(arg => (arg === '--dry-run'));


    let conn = null;
    try {
        conn = await connection(config);

        // Drop the destination Database if it exists
        // await conn.query(`DROP DATABASE IF EXISTS ${config.destinationDb}`);
        // await conn.query(`CREATE DATABASE ${config.destinationDb}`);
        //
        // //lets use it.
        // await conn.query(`use  ${config.destinationDb}`);
        // await conn.query(`source ./openmrs-no-data.sql`);

        utils.logInfo(logTime(), ': Disabling Foreign Key checks on destination');

        await conn.query('SET FOREIGN_KEY_CHECKS=0');

        utils.logInfo(logTime(), ': Starting data migration ...');

        // Create the dummies.
        // await createDummies(conn, config);
        // // Selected locations
        // await locationMover(conn, config);
        //
        // // Encounters
        // await encounterMover(conn, config);

        await personCopier(conn, config);

    } catch (ex) {
        await conn.query('SET FOREIGN_KEY_CHECKS=1');
        utils.logError(ex);
        utils.logInfo('Aborting...clean destination db before running again');
    } finally {
        if (conn) conn.end();
        let timeElapsed = (Date.now() - startTime);
        utils.logInfo(`Time elapsed: ${timeElapsed} ms`);
    }
}

module.exports = orchestration; // In case one needs to require it.

// Run
orchestration();
