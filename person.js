'use strict';
const DUMMY_USER_ID = require('./constants').DUMMY_USER_ID;
const DUMMY_PROVIDER_ID = require('./constants').DUMMY_PROVIDER_ID;
const utils = require('./utils');

async function main(conn, config) {
    let condition = `person_id IN (SELECT DISTINCT(patient_id) ` +
    `FROM ${config.destinationDb}.encounter)`;
    let sql = utils.createInsertSQL('person', condition);
    let countBefore, count;
    try {
        utils.logInfo('Copying persons associated with extracted encounters...');
        countBefore = await utils.getCount(conn, config.destinationDb, 'person');
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'person');

        // Update person Audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'person');
        utils.logOk(`Ok...Finished copying ${count - countBefore} person records`);

        // person_name.
        utils.logInfo('Copying person names associated with copied persons...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person WHERE ` +
            `${config.sourceDb}.person_name.person_id = ` +
            `${config.destinationDb}.person.person_id)`;
        sql = utils.createInsertSQL('person_name', condition);
        countBefore = await utils.getCount(conn, config.destinationDb, 'person_name');
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'person_name');

        //Update person_name audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'person_name');
        utils.logOk(`Ok...Finished copying ${count - countBefore} person_names`);
    }
    catch(ex) {
        utils.logError(`An error occured when copying data...`);
        if(sql) {
            utils.logError(`SQL during error: `, sql);
        }
        throw ex;
    }
}

module.exports = main;
