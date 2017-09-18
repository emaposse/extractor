let utils = require('./utils');

function createEncounterInsertCondition(locationIds, encounterTypeIds) {
    let condition = 'location_id';

    if(locationIds.length > 1) {
        condition += ` IN (${locationIds.join(',')})`;
    }
    else {
        condition += ` = ${locationIds[0]}`;
    }

    if(Array.isArray(encounterTypeIds) && encounterTypeIds.length > 0) {
        condition += ` AND encounter_type`;
        if(encounterTypeIds.length > 1) {
            condition += ` IN (${encounterTypeIds.join(', ')})`;
        }
        else {
            condition += ` = ${encounterTypeIds[0]}`;
        }
    }
    return condition;
}

async function main(connection, config) {
    if(!Array.isArray(config.locationIds)) {
        throw new Error('Please configure locationIds array');
    }
    let query;
    try {
        utils.logInfo('Moving encounters...');
        let condition = createEncounterInsertCondition(config.locationIds,
                                                    config.encounterTypeIds);
        query = utils.createInsertSQL('encounter', condition);
        await connection.query(query);

        let moved = await utils.getCount(connection, config.destinationDb,
                                                                'encounter');
        utils.logOk(`Ok... ${moved} encounter records moved.`);

        utils.logInfo('Moving encounter providers...');
        condition = `encounter_id IN ` +
            `(SELECT encounter_id FROM ${config.destinationDb}.encounter)`;
        query = utils.createInsertSQL('encounter_provider', condition);
        await connection.query(query);
        moved = await utils.getCount(connection, config.destinationDb,
                                                        'encounter_provider');
        utils.logOk(`Ok... ${moved} encounter_provider records moved.`);
    }
    catch(err) {
        if(query) {
            utils.logError(`SQL statement during error: `, query);
        }
        throw err;
    }
}

module.exports = main;
