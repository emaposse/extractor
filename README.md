# OpenMRS Extractor

## Introduction
This nodejs application extracts openmrs data for selected locations from an
existing OpenMRS database into a separate database whose name is specified in  
the configuration file.

## How It Works
The application works by copying records in encounter table which are selected
based on the location_id value as specified by *locationIds* array in the
*config.json* file. On top of location_id the records can be selected using
encounter_id value as specified by *encounterIds* array.

Before running the application, a new database whose name is specified in the
configuration file. Also the database contains bare openmrs tables created by
running the file `openmrs-no-data.sql`;

**Note:**
1. For the purpose of this implementation, some of the tables are purposely ignored
   (See below for the list of tables included)
2. Every time the application is run the destination database has to clean with
   tables without data.

## Tables
Below is the list of tables whose records are moved.
1. *person*

2. *person_attribute*

3. *person_name*

4. *person_address*

5. *relationship*

6. *patient*

7. *patient_identifier*

8. *location*

9. *visit*

10. *encounter*

11. *encounter_provider*

12. *obs*

13. *patient_state*

14. *GAAC module gaac*

15. *GAAC module gaac_member*



## Requirements
* nodejs 7+

## Running
Clone the code from github.

`$ git clone https://github.com/FriendsInGlobalHealth/extractor.git`

Change into the project directory.
```shell
$ cd extractor
```

Create the destination database.
```shell
$ mysql -u<username> -p
mysql> CREATE DATABASE dest;

mysql> USE dest;

mysql> SET FOREIGN_KEY_CHECKS = 0;

mysql> source ./openmrs-no-data.sql
```

Create a JSON configuration file called
*config.json* putting the following content.
```javascript
{
    "host": "mysql instance",
    "username": "username",
    "password": "secret",
    "sourceDb": "Existing database to extract data from",
    "destinationDb": "Database to extract data to",
    "dummyUsername": "username for the dummy user (default dummy)",
    "dummyProviderName": "Dummy Provider Name (def Dummy Provider)",
    "locationIds": [3,7],   // An array of location_id (s) to be copied (Must)
    "encounterTypeIds": [], // An array of encounter_type_id (s) to be copied
}
```

**Note:** Substitute the given values with appropriate values.
* dummyUsername, dummyProviderName and encounterTypeIds are optional.

Once the configuration file is in place, Install the required dependencies:

```shell
$ npm install
```

Run the application
```shell
$ node --harmony orchestrator.js
```
