'use strict';
const utils = require('./utils');

async function main(conn, config) {
    let countBefore, count, condition, sql;
    try {
        // Copying patient records associated with already moved person
        // That means person have to be moved first.
        utils.logInfo('Copying patients associated with copied persons...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.person ` +
            `WHERE ${config.destinationDb}.person.person_id = ` +
            `${config.sourceDb}.patient.patient_id)`;
        sql = utils.createInsertSQL('patient', condition);

        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'patient');

        // Update patient Audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'patient');
        utils.logOk(`Ok...Finished copying ${count} patient records`);

        // copying patient_identifier records.
        utils.logInfo('Copying patient identifiers associated with copied patients...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.patient WHERE ` +
            `${config.sourceDb}.patient_identifier.patient_id = ` +
            `${config.destinationDb}.patient.patient_id)`;
        sql = utils.createInsertSQL('patient_identifier', condition);
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'patient_identifier');

        // Update patient_identifier audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'patient_identifier');
        utils.logOk(`Ok...Finished copying ${count} patient_identifiers`);

        // copying patient_program records.
        utils.logInfo('Copying patient programs associated with copied patients...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.patient WHERE ` +
            `${config.sourceDb}.patient_program.patient_id = ` +
            `${config.destinationDb}.patient.patient_id)`;
        sql = utils.createInsertSQL('patient_program', condition);
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'patient_program');

        // Update patient_program audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'patient_program');
        utils.logOk(`Ok...Finished copying ${count} patient_programs`);

        // copying patient_state records.
        utils.logInfo('Copying patient states associated with copied patients...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.patient_program WHERE ` +
            `${config.sourceDb}.patient_state.patient_program_id = ` +
            `${config.destinationDb}.patient_program.patient_program_id)`;
        sql = utils.createInsertSQL('patient_state', condition);
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'patient_state');

        // Update patient_state audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'patient_state');
        utils.logOk(`Ok...Finished copying ${count} patient_states`);

        // copying visit records.
        utils.logInfo('Copying patient programs associated with copied patients...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.patient WHERE ` +
            `${config.sourceDb}.visit.patient_id = ` +
            `${config.destinationDb}.patient.patient_id)`;
        sql = utils.createInsertSQL('visit', condition);
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'visit');

        // Update visit audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'visit');
        utils.logOk(`Ok...Finished copying ${count} visits`);

        // copying obs records.
        utils.logInfo('Copying patient programs associated with copied patients...');
        condition = `EXISTS (SELECT 1 FROM ${config.destinationDb}.patient WHERE ` +
            `${config.sourceDb}.obs.person_id = ` +
            `${config.destinationDb}.patient.patient_id)`;
        sql = utils.createInsertSQL('obs', condition);
        await conn.query(sql);
        count = await utils.getCount(conn, config.destinationDb, 'obs');

        // Update obs audit info
        await utils.updateAuditInfo(conn, config.destinationDb, 'obs');
        utils.logOk(`Ok...Finished copying ${count} obs`);
    }
    catch(ex) {
        utils.logError(`An error occured when copying patient related data...`);
        if(sql) {
            utils.logError(`SQL during error: `, sql);
        }
        throw ex;
    }
}

module.exports = main;
