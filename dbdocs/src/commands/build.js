const { Command, Flags } = require('@oclif/core');
const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getOrg } = require('../utils/org');
const { shouldAskForFeedback } = require('../utils/feedback');
const { isValidName } = require('../validators/projectName');
const parse = require('../utils/parse');

async function build (project, authConfig) {
  const res = await axios.post(`${vars.apiUrl}/projects`, project, authConfig);
  if (![200, 201].includes(res.status)) {
    throw new Error('Something wrong :( Please try again.');
  }
  return { newProject: res.data.project, isCreated: res.status === 201 };
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

      let { flags: { project, password } } = await this.parse(BuildCommand);
      const { args } = await this.parse(BuildCommand);

      const { filepath } = args;
      let content = '';
      content = fs.readFileSync(path.resolve(process.cwd(), filepath), 'utf-8');

      const userOrg = await getOrg(authConfig);
      const org = userOrg.name;

      // validate dbml syntax, get project name if it's already defined in the file
      spinner.text = 'Parsing file content';
      spinner.start();
      let model = null;
      try {
        model = await parse(content);
        if (!project) {
          project = model.name;
        }
        spinner.succeed('Parsing file content');
      } catch (error) {
        if (!error.location) throw error;
        const message = `You have syntax error in ${path.basename(filepath)} line ${error.location.start.line} column ${error.location.start.column}. ${error.message}`;
        throw new Error(message);
      }

      // if project name is not defined yet, ask user to input the project name
      if (!project) {
        project = await enterProjectName();
      }

      while (!isValidName(project)) {
        spinner.warn('Invalid project name! Project name can only contain only alphabets, numbers, space, "-" or "_" and can not be blanked!');
        project = await enterProjectName();
      }

      // pushing project
      spinner.text = `Pushing new database to project ${project}`;
      spinner.start();
      try {
        const { newProject, isCreated } = await build({
          projectName: project,
          password,
          orgName: org,
          doc: {
            content,
          },
          shallowSchema: model.schemas,
        }, authConfig);
        if (!newProject.isPublic) {
          if (isCreated || password) {
            spinner.succeed(`Password is set for '${newProject.name}'`);
          }
        } else {
          spinner.warn(`Password is not set for '${newProject.name}'`);
        }
        spinner.succeed(`Done. Visit: ${chalk.cyan(`${vars.hostUrl}/${newProject.org.name}/${newProject.urlName}`)}\n`);
        if (shouldAskForFeedback()) {
          spinner.info(`Thanks for using dbdocs! We'd love to hear your feedback: ${chalk.cyan('https://form.jotform.com/200962053361448')}`);
        }
      } catch (err) {
        let message = err.message || 'Something wrong :( Please try again.';
        if (err.response) {
          const { error } = err.response.data;
          if (error.name === 'SyntaxError') {
            message = `You have syntax error in ${path.basename(filepath)} line ${error.location.start.line} column ${error.location.start.column}. ${error.message}`;
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

BuildCommand.flags = {
  project: Flags.string({ description: 'project name' }),
  password: Flags.string({ char: 'p', description: 'password for project' }),
};

BuildCommand.args = [
  { name: 'filepath', description: 'dbml file path' },
];

module.exports = BuildCommand;
