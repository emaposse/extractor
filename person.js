'use strict';
const utils = require('./utils');

async function main(conn, config) {
    let countBefore, count;
    let condition = `username IN ('admin', 'daemon') OR ` +
                            `system_id IN ('admin', 'daemon')`;
    let sql = utils.createInsertSQL('users', condition);
    try {
        // Copy few users for administrative purposes (i.e Openmrs Credos);
        utils.logInfo('Copying selected users');
        countBefore = await utils.getCount(conn, config.destinationDb, 'users');
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'users');
        utils.logOk(`Ok...${count - countBefore} users copied.`);

        // now make the associated person if any. (Excluding anything having
        // encuonter records)
        condition = `person_id IN (SELECT person_id FROM ` +
            `${config.destinationDb}.users) AND NOT EXISTS (SELECT 1 FROM ` +
            `${config.sourceDb}.encounter e JOIN ${config.destinationDb}.users u `+
            `ON e.patient_id = u.person_id)`;
        sql = utils.createInsertSQL('person', condition);

        utils.logInfo(`Copying users assocatied person records`);
        await conn.query(sql);
        utils.logOk(`Ok...associated persons copied`);

        // Copying person having encounters
        utils.logInfo('Copying persons associated with extracted encounters...');
        condition = `person_id IN (SELECT DISTINCT(patient_id) ` +
        `FROM ${config.destinationDb}.encounter)`;
        sql = utils.createInsertSQL('person', condition);

        countBefore = await utils.getCount(conn, config.destinationDb, 'person');
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'person');

        // Update person Audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'person');
        utils.logOk(`Ok...Finished copying ${count - countBefore} person records`);

        // copying person_name records.
        utils.logInfo('Copying person names associated with copied persons...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person WHERE ` +
            `${config.sourceDb}.person_name.person_id = ` +
            `${config.destinationDb}.person.person_id)`;
        sql = utils.createInsertSQL('person_name', condition);
        countBefore = await utils.getCount(conn, config.destinationDb, 'person_name');
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'person_name');

        // Update person_name audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'person_name');
        utils.logOk(`Ok...Finished copying ${count - countBefore} person_names`);

        // Copy person relations
        utils.logInfo('Copying person relations associated with copied persons...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person p ` +
            `WHERE ${config.sourceDb}.relationship.person_a = p.person_id) ` +
            `AND EXISTS (SELECT 1 FROM ${config.destinationDb}.person p ` +
            `WHERE ${config.sourceDb}.relationship.person_b = p.person_id)`;
        sql = utils.createInsertSQL('relationship', condition);
        await conn.query(sql);

        count = await utils.getCount(conn, config.destinationDb, 'relationship');
        await utils.updateAuditInfo(conn, config.destinationDb, 'relationship');
        utils.logOk(`Ok... Finished copying ${count} relationships`);

        // Copying person address
        utils.logInfo('Copying person addresses');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person p ` +
            `WHERE ${config.sourceDb}.person_address.person_id = p.person_id) `;
        sql = utils.createInsertSQL('person_address', condition);
        await conn.query(sql);

        count = await utils.getCount(conn, config.destinationDb, 'person_address');
        await utils.updateAuditInfo(conn, config.destinationDb, 'person_address');
        utils.logOk(`Ok... Finished copying ${count} person_address records`);

        // Copying person address
        utils.logInfo('Copying person attributes');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person p ` +
            `WHERE ${config.sourceDb}.person_attribute.person_id = p.person_id) `;
        sql = utils.createInsertSQL('person_attribute', condition);
        await conn.query(sql);

        count = await utils.getCount(conn, config.destinationDb, 'person_attribute');
        await utils.updateAuditInfo(conn, config.destinationDb, 'person_attribute');
        utils.logOk(`Ok... Finished copying ${count} person_attribute records`);

    }
    catch(ex) {
        utils.logError(`An error occured when copying person data...`);
        if(sql) {
            utils.logError(`SQL during error: `, sql);
        }
        throw ex;
    }
}

module.exports = main;
