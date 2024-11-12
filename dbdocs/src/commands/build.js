const { Command, flags } = require('@oclif/command');
const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getOrg } = require('../utils/org');

async function validate (content) {
  const res = await axios.post(`${vars.apiUrl}/parse`, {
    content,
  });

  return res.data.model;
}

async function build (project, authToken) {
  const res = await axios.post(`${vars.apiUrl}/projects`, project, {
    headers: {
      Authorization: authToken,
    },
  });
  if (![200, 201].includes(res.status)) {
    throw new Error('Something wrong :( Please try again.');
  }
  return { newProject: res.data.project, isCreated: res.status === 201 };
}

class BuildCommand extends Command {
  async run () {
    const spinner = ora({});
    try {
      const authToken = await verifyToken();

      let { flags: { project, password } } = this.parse(BuildCommand);
      const { args } = this.parse(BuildCommand);

      const { filepath } = args;
      let content = '';
      content = fs.readFileSync(path.resolve(process.cwd(), filepath), 'utf-8');

      const userOrg = await getOrg(authToken);
      const org = userOrg.name;

      // validate dbml syntax, get project name if it's already defined in the file
      spinner.text = 'Parsing file content';
      spinner.start();
      try {
        const model = await validate(content);
        if (!project) {
          project = model.database['1'].name;
        }
        spinner.succeed('Parsing file content');
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

      // if project name is not defined yet, ask user to input the project name
      if (!project) {
        const answer = await inquirer.prompt([
          {
            message: 'Project name: ',
            name: 'project',
          },
        ]);
        project = answer.project;
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
        }, authToken);
        if (!newProject.isPublic) {
          if (isCreated || password) {
            spinner.succeed(`Password is set for '${newProject.name}'`);
          }
        } else {
          spinner.warn(`Password is not set for '${newProject.name}'`);
        }
        spinner.succeed(`Done. Visit: ${chalk.cyan(`${vars.hostUrl}/${newProject.org.name}/${newProject.urlName}`)}`);
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
  project: flags.string({ description: 'project name' }),
  password: flags.string({ char: 'p', description: 'password for project' }),
};

BuildCommand.args = [
  { name: 'filepath', description: 'dbml file path' },
];

module.exports = BuildCommand;
