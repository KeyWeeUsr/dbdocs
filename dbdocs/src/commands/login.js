const { Command } = require('@oclif/command');
const open = require('open');
const inquirer = require('inquirer');
const axios = require('axios');
const ora = require('ora');
const netrc = require('netrc-parser').default;
const { vars } = require('../vars');

class LoginCommand extends Command {
  async run () {
    const spinner = ora({});
    try {
      await open(`${vars.hostUrl}/login/cli`, { wait: false });
      const answer = await inquirer.prompt([
        {
          message: 'Please input your authentication token: ',
          name: 'authToken',
        },
      ]);

      spinner.text = 'Validate token';
      spinner.start();
      const { authToken } = answer;
      const { data: { account } } = await axios.get(`${vars.apiUrl}/account`, {
        headers: {
          Authorization: authToken,
        },
      });
      spinner.succeed();

      spinner.text = 'Save credential';
      spinner.start();
      const { apiHost } = vars;
      await netrc.load();
      const previousEntry = netrc.machines[apiHost];
      if (!previousEntry) {
        netrc.machines[apiHost] = {};
      }
      netrc.machines[apiHost].login = account.email;
      netrc.machines[apiHost].password = authToken;
      await netrc.save();
      spinner.succeed();

      this.log('\nDone.');
    } catch (err) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
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
            break;
        }
      }
      this.error(message);
    }
  }
}

LoginCommand.description = `login to dbdocs
login with your dbdocs credentials
`;

module.exports = LoginCommand;
