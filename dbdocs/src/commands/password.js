const { Command, flags } = require('@oclif/command');
const axios = require('axios');
const inquirer = require('inquirer');
const ora = require('ora');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getOrg } = require('../utils/org');

const removePassword = async (projectName, org, authToken) => {
  await axios.delete(`${vars.apiUrl}/projects/${projectName}/password`, {
    headers: {
      Authorization: authToken,
    },
    data: {
      org,
    },
  });
};

const updatePassword = async (projectName, org, password, authToken) => {
  await axios.put(`${vars.apiUrl}/projects/${projectName}/password`, {
    org,
    password,
  }, {
    headers: {
      Authorization: authToken,
    },
  });
};

class PasswordCommand extends Command {
  async run () {
    const spinner = ora({});
    try {
      let { flags: { project, set, remove } } = this.parse(PasswordCommand);

      if (set && remove) {
        throw new Error('You must choose one, set password or remove.');
      }
      const authToken = await verifyToken();
      const org = await getOrg(authToken);

      if (!project) {
        const answer = await inquirer.prompt([
          {
            message: 'Project name: ',
            name: 'project',
          },
        ]);
        project = answer.project;
      }
      if (!(set || remove)) {
        const answer = await inquirer.prompt([
          {
            message: 'Enter password: ',
            name: 'password',
            type: 'password',
          },
          {
            message: 'Re-enter password: ',
            name: 'reenterPassword',
            type: 'password',
          },
        ]);
        if (answer.password !== answer.reenterPassword) {
          throw new Error('Those password didn\'t match. Try again.');
        }
        set = answer.password;
        if (!set) {
          throw new Error('Password can not be blank');
        }
      }

      if (remove) {
        spinner.start('Removing password');
        await removePassword(project, org, authToken);
        spinner.warn(`Password is removed from '${project}'.`);
      } else if (set) {
        spinner.start('Setting password');
        await updatePassword(project, org, set, authToken);
        spinner.succeed(`Password is set for '${project}'.`);
      }
    } catch (err) {
      let message = err.message || 'Something wrong :( Please try again.';
      if (err.response) {
        const { error } = err.response.data;
        switch (error.name) {
          case 'TokenExpiredError':
            message = 'Your token has expired. Please login again.';
            break;

          case 'InvalidAuthToken':
            message = 'Invalid token. Please login again.';
            break;

          default:
            message = error.message;
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

PasswordCommand.description = 'set password for your project or remove password';

PasswordCommand.flags = {
  project: flags.string({ char: 'p', description: 'project name', helpValue: 'project name' }),
  set: flags.string({ char: 's', description: 'password for your project', helpValue: 'password' }),
  remove: flags.boolean({ char: 'r', description: 'remove password from your project' }),
};

module.exports = PasswordCommand;
