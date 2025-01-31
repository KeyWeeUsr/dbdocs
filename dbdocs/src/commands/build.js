const { Command, Flags } = require('@oclif/core');
const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const removeMd = require('remove-markdown');
const { VERSION } = require('@dbml/core');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getOrg } = require('../utils/org');
const { shouldAskForFeedback } = require('../utils/feedback');
const { isValidName } = require('../validators/projectName');
const parse = require('../utils/parse');
const { PROJECT_GENERAL_ACCESS_TYPE, FLAG_HELP_GROUP } = require('../utils/constants');
const { getProjectUrl, parseProjectName } = require('../utils/helper');
const { getIsPublicValueFromBuildFlag } = require('../utils/helper');
const { formatParserV2ErrorMessage } = require('../utils/error-formatter');

async function build (project, authConfig) {
  const res = await axios.post(`${vars.apiUrl}/projects`, project, authConfig);
  if (![200, 201].includes(res.status)) {
    throw new Error('Something wrong :( Please try again.');
  }
  return { newProject: res.data.project, isCreated: res.status === 201 };
}

async function enterOrgName (defaultOrgName) {
  const answer = await inquirer.prompt([
    {
      message: `Username: (${defaultOrgName})`,
      name: 'orgName',
    },
  ]);
  return answer.orgName || defaultOrgName;
}

async function enterProjectName () {
  const answer = await inquirer.prompt([
    {
      message: 'Project name: ',
      name: 'project',
    },
  ]);
  return answer.project;
}

class BuildCommand extends Command {
  async run () {
    const spinner = ora({});

    try {
      const authConfig = await verifyToken();
      const { flags, args } = await this.parse(BuildCommand);
      const {
        public: publicFlag, private: privateFlag, password, project,
      } = flags;

      const { filepath } = args;
      let content = '';
      content = fs.readFileSync(path.resolve(process.cwd(), filepath), 'utf-8');

      const defaultOrgName = (await getOrg(authConfig)).name;
      let orgName = '';
      let projectNameFromDbml = null;
      let projectNameFromInput = null;

      // Re-parse the project name from argument to get the username
      if (project) {
        const parseRes = parseProjectName(project);

        if (!parseRes) spinner.warn('Invalid username or project name!');
        else [orgName, projectNameFromInput] = parseRes;
      }

      // validate dbml syntax, get project name if it's already defined in the file
      spinner.text = 'Parsing file content';
      spinner.start();
      let model = null;
      try {
        model = await parse(content);
        if (!project) {
          projectNameFromDbml = model.name;
        }
        spinner.succeed('Parsing file content');
      } catch (error) {
        const rawMessage = formatParserV2ErrorMessage(error);
        const message = rawMessage ? `You have syntax error(s) in ${path.basename(filepath)}\n${rawMessage}` : 'Something wrong :( Please try again.';
        throw new Error(message);
      }

      if (!orgName) orgName = defaultOrgName;

      let projectName = projectNameFromInput || projectNameFromDbml;

      // if project name is not defined yet, ask user to input the project name
      if (!projectName) {
        // ask the username to publish to
        orgName = await enterOrgName(defaultOrgName);
        while (!isValidName(orgName)) {
          // eslint-disable-next-line max-len
          spinner.warn('Invalid username! Username can only contain alphabets, numbers, space, "-" or "_", or leave it blank to publish to your personal account!');
          // eslint-disable-next-line no-await-in-loop
          orgName = await enterOrgName(defaultOrgName);
        }
        projectName = await enterProjectName();
      }

      while (!isValidName(projectName)) {
        spinner.warn('Invalid project name! Project name can only contain alphabets, numbers, space, "-" or "_" and can not be blanked!');
        // eslint-disable-next-line no-await-in-loop
        projectName = await enterProjectName();
      }

      // pushing project
      spinner.text = `Pushing new database to project ${projectName}`;
      spinner.start();
      try {
        const isPublic = getIsPublicValueFromBuildFlag(publicFlag, privateFlag, password);
        const { newProject } = await build({
          projectName,
          description: removeMd(model.description),
          isPublic,
          password,
          orgName,
          doc: {
            content,
          },
          shallowSchema: model.schemas,
          normalizedDatabase: model.normalizedDatabase,
          dbmlVersion: VERSION,
          clientType: 'cli',
        }, authConfig);
        switch (newProject.generalAccessType) {
          case PROJECT_GENERAL_ACCESS_TYPE.public:
            spinner.warn(`Project '${newProject.name}' is public, consider setting password or restricting access to it`);
            break;
          case PROJECT_GENERAL_ACCESS_TYPE.protected:
            spinner.succeed(`Project '${newProject.name}' is protected with password`);
            break;
          case PROJECT_GENERAL_ACCESS_TYPE.restricted:
            spinner.succeed(`Project '${newProject.name}' is private`);
            break;
          default:
            break;
        }
        spinner.succeed(`Done. Visit: ${chalk.cyan(getProjectUrl(vars.hostUrl, newProject.org.name, newProject.urlName))}\n`);
        if (shouldAskForFeedback()) {
          spinner.info(`Thanks for using dbdocs! We'd love to hear your feedback: ${chalk.cyan('https://form.jotform.com/200962053361448')}`);
        }
      } catch (err) {
        let message = err.message || 'Something wrong :( Please try again.';
        if (err.response) {
          const { error } = err.response.data;
          if (error.name === 'SyntaxError') {
            // eslint-disable-next-line max-len
            message = `You have syntax error(s) in ${path.basename(filepath)} line ${error.location.start.line} column ${error.location.start.column}. ${error.message}`;
          } else if (error.name === 'AccessDenied') {
            message = error.message;
          }
        }
        throw new Error(message);
      }
    } catch (err) {
      let message = err.message || 'Something wrong :( Please try again.';
      if (err.response) {
        const { error } = err.response.data;
        switch (error.name) {
          case 'TokenExpiredError':
            message = 'Your token has expired. Please login again.';
            break;

          case 'NotFound':
          case 'InvalidAuthToken':
            message = 'Invalid token. Please login again.';
            break;

          default:
            break;
        }
      }
      if (spinner.isSpinning) {
        spinner.fail(`Failed: ${message}`);
      } else {
        this.error(message);
      }
    }
  }
}

BuildCommand.description = 'build docs';

// `public`, `private` and `password` are mutually exclusive flags. For example:
// dbdocs build ./abc.dbml --project abc --public # works
// dbdocs build ./abc.dbml --project abc --private # works
// dbdocs build ./abc.dbml --project abc --password 123456 # works
// dbdocs build ./abc.dbml --project abc --password 123456 --private # error
// dbdocs build ./abc.dbml --project abc --public --private # error
// dbdocs build ./abc.dbml --project abc --public --password 123456 # error
BuildCommand.flags = {
  project: Flags.string({ description: '<username>/<project_name> or <project_name>' }),
  public: Flags.boolean({ description: 'anyone with the URL can access', helpGroup: FLAG_HELP_GROUP.sharing, exclusive: ['private', 'password'] }),
  private: Flags.boolean({ description: 'only invited people can access', helpGroup: FLAG_HELP_GROUP.sharing, exclusive: ['public', 'password'] }),
  password: Flags.string({
    char: 'p', description: 'anyone with the URL + password can access', helpGroup: FLAG_HELP_GROUP.sharing, exclusive: ['public', 'private'],
  }),
};

BuildCommand.args = [
  { name: 'filepath', description: 'dbml file path' },
];

module.exports = BuildCommand;
