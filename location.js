const utils = require('./utils');
const DUMMY_USER_ID = require('./constants').DUMMY_USER_ID;

async function moveSelectedLocations(conn, config) {
    if(Array.isArray(config.locationIds) && config.locationIds.length === 0) {
        return;
    }

    let condition = 'location_id';
    if(config.locationIds.length > 1) {
        condition += ` IN (${config.locationIds.join(',')})`;
    }
    else {
        condition += ` = ${config.locationIds[0]}`;
    }

    let sql = utils.createInsertSQL('location', condition);;

    try {
        utils.logInfo('Moving selected locations');
        await conn.query(sql);
        sql = `UPDATE ${config.destinationDb}.location SET creator = ${DUMMY_USER_ID}` +
            `, retired_by = IF(retired, ${DUMMY_USER_ID}, NULL)`;
        await conn.query(sql);
        utils.logOk(`Ok...Selected locations moved.`);
    }
    catch(ex) {
        utils.logError('Error while moving selected locations');
        if(sql) {
            utils.logError('Statement during error:');
            utils.logError(sql);
        }
        throw ex;
    }
}

module.exports = moveSelectedLocations;
