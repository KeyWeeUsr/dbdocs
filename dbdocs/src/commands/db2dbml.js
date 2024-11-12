/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const { Command, Flags } = require('@oclif/core');
const { importer } = require('@dbml/core');
const { connector } = require('@dbml/connector');
const ora = require('ora');
const { SUPPORTED_DATABASE_CONNECTORS } = require('../utils/constants');
const { writeToConsole, writeToFileAsync } = require('../utils/output-writer');

class Db2dbmlCommand extends Command {
  async run () {
    const spinner = ora({});

    try {
      const { flags, argv } = await this.parse(Db2dbmlCommand);
      const { format, connection } = getConnectionOpt(argv);

      spinner.text = 'Connecting to database...';
      spinner.start();

      const schemaJson = await connector.fetchSchemaJson(connection, format);
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
    name: 'format',
    description: 'your database format (postgres, mysql, mssql)',
    required: true,
  },
  {
    name: 'connection-string',
    description: `your database connection string:
    - postgres: postgresql://user:password@localhost:5432/dbname
    - mysql: mysql://user:password@localhost:3306/dbname
    - mssql: 'Server=localhost,1433;Database=master;User Id=sa;Password=your_password;Encrypt=true;TrustServerCertificate=true;'`,
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

/**
 * @param {string[]} argv
 * @returns {{ format: string, connection: string}}
 */
function getConnectionOpt (argv) {
  const defaultConnectionOpt = {
    format: 'unknown',
    connection: argv[1],
  };

  const options = argv.reduce((connectionOpt, arg) => {
    if (SUPPORTED_DATABASE_CONNECTORS.includes(arg)) {
      connectionOpt.format = arg;
    }

    // Check if the arg is a connection string using regex
    const connectionStringRegex = /^.*[:;]/;
    if (connectionStringRegex.test(arg)) {
      // Example: jdbc:mysql://localhost:3306/mydatabase
      // Example: odbc:Driver={SQL Server};Server=myServerAddress;Database=myDataBase;Uid=myUsername;Pwd=myPassword;
      connectionOpt.connection = arg;
    }

    return connectionOpt;
  }, defaultConnectionOpt);

  return options;
}

module.exports = Db2dbmlCommand;
