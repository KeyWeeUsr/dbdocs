const { Command, CliUx } = require('@oclif/core');
const chalk = require('chalk');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getProjectsByOrg } = require('../utils/org');
const { getOrg } = require('../utils/org');

class LsCommand extends Command {
  async run () {
    try {
      const authConfig = await verifyToken();
      const org = await getOrg(authConfig);
      const projects = await getProjectsByOrg(org.name, authConfig);
      this.log(chalk.bold(org.name));

      const [maxUrlWidth, maxUpdatedAtWidth] = projects.reduce((accumulator, project) => {
        const url = `${vars.hostUrl}/${org.name}/${project.urlName}`;
        const updatedAt = (new Date(project.updatedAt)).toLocaleString();
        return [
          accumulator[0] > url.length ? accumulator[0] : url.length,
          accumulator[1] > updatedAt.length ? accumulator[1] : updatedAt.length,
        ];
      }, [3, 12]);

      CliUx.ux.table(projects, {
        name: {
          minWidth: 20,
        },
        isPublic: {
          minWidth: 12,
          header: 'Password',
          // eslint-disable-next-line no-confusing-arrow
          get: (project) => project.isPublic ? 'No' : 'Yes',
        },
        url: {
          minWidth: maxUrlWidth + 2,
          get: (project) => chalk.cyan(`${vars.hostUrl}/${org.name}/${project.urlName}`),
        },
        updatedAt: {
          minWidth: maxUpdatedAtWidth + 2,
          header: 'Last updated',
          get: (project) => (new Date(project.updatedAt)).toLocaleString(),
        },
      }, {
        printLine: this.log.bind(this),
      });
    } catch (err) {
      this.error(err);
    }
  }
}

LsCommand.description = 'list projects';

module.exports = LsCommand;
