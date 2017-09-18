'use strict';
const utils = require('./utils');
const uuidGenerator = require('uuid/v1');
const strValue = utils.stringValue;
const DUMMY_PERSON_ID_OFFSET = 999;
const DUMMY_USER_ID = require('./constants').DUMMY_USER_ID;
const DUMMY_PROVIDER_ID = require('./constants').DUMMY_PROVIDER_ID;

const nowDate = strValue(utils.formatDate((new Date()).toISOString()));

async function makeDummyUser(conn, config) {
    let dummyUsername = config.dummyUsername || 'DummyUser';
    let sql = `SELECT max(person_id) AS 'maxi_p' FROM ${config.sourceDb}.person`;

    try {
        let [r] = await conn.query(sql);
        let dummyPersonId = r[0]['maxi_p'] + DUMMY_PERSON_ID_OFFSET;

        sql = `INSERT INTO ${config.destinationDb}.person(person_id, gender, ` +
            `birthdate, birthdate_estimated, dead, creator, ` +
            'date_created, voided, uuid) VALUES '+
            `(${dummyPersonId}, 'F', ${nowDate}, 0, 0, 1, ${nowDate}, 0, ` +
            `${strValue(uuidGenerator())})`;

        utils.logInfo('Inserting a person record to associate with dummy user');
        await conn.query(sql);
        utils.logOk(`Ok...person record inserted successfully.`);

        sql = `INSERT INTO ${config.destinationDb}.users` +
            `(user_id, system_id, username, creator, date_created, ` +
            `person_id, retired, uuid) VALUES `+
            `(${DUMMY_USER_ID}, ${strValue(dummyUsername)}, ` +
            `${strValue(dummyUsername)}, 1, ${nowDate}, ` +
            `${dummyPersonId}, 0, ${strValue(uuidGenerator())})`;

        utils.logInfo(`Insert dummy user ${dummyUsername}`);
        await conn.query(sql);
        utils.logOk(`Ok...dummy user inserted`);
    }
    catch(ex) {
        utils.logError('An error occured while dummying the destination...');
        if(sql) {
            utils.logError('Insert statement during the error:');
            utils.logError(sql);
        }
        throw ex;
    }
}

async function dummying(conn, config) {
    let condition = `username IN ('admin', 'daemon') OR ` +
                            `system_id IN ('admin', 'daemon')`;
    let sql = utils.createInsertSQL('users', condition);

    try {
        utils.logInfo('Moving selected users');
        await conn.query(sql);
        utils.logOk('Ok...Users moved.');

        // now make the associated person if any.
        condition = `person_id IN (SELECT person_id FROM ` +
            `${config.destinationDb}.users)`;
        sql = utils.createInsertSQL('person', condition);

        utils.logInfo(`Moving assocatied person records`);
        await conn.query(sql);
        utils.logOk(`Ok...Persons moved`);

        sql = utils.createInsertSQL('person_name', condition);
        utils.logInfo('Moving associated person_name records');
        await conn.query(sql);
        utils.logOk(`Ok...Person names moved`);

        await makeDummyUser(conn, config);

        // Make a dummy provider.
        let dummyProviderName = config.dummyProviderName || 'Dummy Provider';
        sql = `INSERT INTO ${config.destinationDb}.provider(provider_id, ` +
            `name, creator, date_created, uuid) VALUES ` +
            `(${DUMMY_PROVIDER_ID}, ${strValue(dummyProviderName)}, ` +
            `${DUMMY_USER_ID}, ${nowDate}, ${strValue(uuidGenerator())})`;

        utils.logInfo(`Inserting dummy provider ${dummyProviderName}`);
        await conn.query(sql);
        utils.logOk(`Ok...Dummy provider in!`);
    }
    catch(ex) {
        utils.logError('An error occured');
        if(sql) {
            utils.logError('Insert statement during the error:');
            utils.logError(sql);
        }
        throw ex;
    }
}

module.exports = dummying;
