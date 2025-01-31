/* eslint-disable max-len */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const { Command, Flags } = require('@oclif/core');
const { importer } = require('@dbml/core');
const { connector } = require('@dbml/connector');
const ora = require('ora');
const { SUPPORTED_DATABASE_CONNECTORS, WINDOW_FILE_PATH_REGEX, UNIX_FILE_PATH_REGEX } = require('../utils/constants');
const { writeToConsole, writeToFileAsync } = require('../utils/output-writer');

class Db2dbmlCommand extends Command {
  async run () {
    const spinner = ora({});

    try {
      const { flags, argv } = await this.parse(Db2dbmlCommand);
      const { databaseType, connection } = getConnectionOpt(argv);

      spinner.text = 'Connecting to database...';
      spinner.start();

      const schemaJson = await connector.fetchSchemaJson(connection, databaseType);
      spinner.succeed('Connecting to database... done.');

      spinner.start('Generating DBML ...');
      const dbml = importer.generateDbml(schemaJson);
      spinner.succeed('Generating DBML... done');

      const { outFile } = flags;

      if (!outFile || !outFile.trim()) {
        writeToConsole(dbml);
        return;
      }

      spinner.start(`Wrote to ${outFile}`);
      await writeToFileAsync(outFile, dbml);
      spinner.succeed();
    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }

      this.error(error.message);
    }
  }
}

Db2dbmlCommand.description = 'Generate DBML directly from a database';

Db2dbmlCommand.args = [
  {
    name: 'database-type',
    description: 'your database type (postgres, mysql, mssql, snowflake, bigquery)',
    required: true,
  },
  {
    name: 'connection-string',
    description: 'your database connection string (See below examples for more details)',
    required: true,
  },
];

Db2dbmlCommand.flags = {
  outFile: Flags.string({
    description: 'output file path',
    char: 'o',
    helpValue: '/path-to-your-file',
  }),
};

Db2dbmlCommand.examples = [
  'Postgres:',
  "  $ db2dbml postgres 'postgresql://user:password@localhost:5432/dbname?schemas=schema1,schema2'",
  'MySQL:',
  "  $ db2dbml mysql 'mysql://user:password@localhost:3306/dbname'",
  'MSSQL:',
  "  $ db2dbml mssql 'Server=localhost,1433;Database=master;User Id=sa;Password=your_password;Encrypt=true;TrustServerCertificate=true;Schemas=schema1,schema2;'",
  'Snowflake:',
  "  $ db2dbml snowflake 'SERVER=<account_identifier>.<region>;UID=<your_username>;PWD=<your_password>;DATABASE=<your_database>;WAREHOUSE=<your_warehouse>;ROLE=<your_role>;SCHEMAS=schema1,schema2;'",
  'BigQuery:',
  '  $ db2dbml bigquery /path_to_json_credential.json',
  ' ',
  '  Note: Your JSON credential file must contain:',
  '  {',
  '    "project_id": "your-project-id",',
  '    "client_email": "your-client-email",',
  '    "private_key": "your-private-key",',
  '    "datasets": ["dataset_1", "dataset_2", ...]',
  '  }',
  '  If "datasets" key is not provided or is empty, it will fetch all datasets.',
].join('\n');

/**
 * @param {string[]} argv
 * @returns {{ format: string, connection: string}}
 */
function getConnectionOpt (argv) {
  const defaultConnectionOpt = {
    connection: argv[0],
    databaseType: 'unknown',
  };

  const options = argv.reduce((connectionOpt, arg) => {
    if (SUPPORTED_DATABASE_CONNECTORS.includes(arg)) {
      connectionOpt.databaseType = arg;
    }

    // Check if the arg is a connection string using regex
    const connectionStringRegex = /^.*[:;]/;
    if (connectionStringRegex.test(arg)) {
      // Example: jdbc:mysql://localhost:3306/mydatabase
      // Example: odbc:Driver={SQL Server};Server=myServerAddress;Database=myDataBase;Uid=myUsername;Pwd=myPassword;
      connectionOpt.connection = arg;
    }

    // check if the arg is a valid path to credential json file
    if (WINDOW_FILE_PATH_REGEX.test(arg) || UNIX_FILE_PATH_REGEX.test(arg)) {
      connectionOpt.connection = arg;
    }

    return connectionOpt;
  }, defaultConnectionOpt);

  return options;
}

module.exports = Db2dbmlCommand;
