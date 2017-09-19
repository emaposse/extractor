'use strict';
const utils = require('./utils');

async function main(conn, config) {
    let count, condition, sql;
    try {
        utils.logInfo('Checking if gaac module tables exists in source');
        await conn.query(`use ${config.sourceDb}`);
        let [r] = await conn.query(`SHOW TABLES LIKE 'gaac%'`);

        if(r.length === 0) {
            utils.logInfo('No gaac tables found');
            return;
        }

        // Copying gaac_member records
        // Note: This should happen after person table records have been copied
        utils.logInfo('Copying gaac_member records');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person p ` +
            `WHERE ${config.sourceDb}.gaac_member.member_id = p.person_id) `;
        sql = utils.createInsertSQL('gaac_member', condition);
        await conn.query(sql);

        count = await utils.getCount(conn, config.destinationDb, 'gaac_member');
        await utils.updateAuditInfo(conn, config.destinationDb, 'gaac_member');
        utils.logOk(`Ok... Finished copying ${count} gaac_member records`);

        // Copying gaac records
        utils.logInfo('Copying gaac records');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.gaac_member gm ` +
            `WHERE ${config.sourceDb}.gaac.gaac_id = gm.gaac_id) `;
        sql = utils.createInsertSQL('gaac', condition);
        await conn.query(sql);

        count = await utils.getCount(conn, config.destinationDb, 'gaac');
        await utils.updateAuditInfo(conn, config.destinationDb, 'gaac');
        utils.logOk(`Ok... Finished copying ${count} gaac records`);

    }
    catch(ex) {
        utils.logError(`An error occured when gaac data...`);
        if(sql) {
            utils.logError(`SQL during error: `, sql);
        }
        throw ex;
    }
}

module.exports = main;
