const { Command, CliUx } = require('@oclif/core');
const chalk = require('chalk');
const { vars } = require('../vars');
const verifyToken = require('../utils/verifyToken');
const { getProjectsByOrg, getProjectUserRolesByOrg } = require('../utils/org');
const { getOrg } = require('../utils/org');
const { PROJECT_SHARING_TEXT } = require('../utils/constants');
const { getProjectUrl } = require('../utils/helper');

const ROLE_DESCRIPTIONS = {
  viewer: 'View only',
  editor: 'View and edit',
  admin: 'Administrator',
  noAccess: 'No access',
};

class LsCommand extends Command {
  showProjects (projects, orgName) {
    const [maxUrlWidth, maxUpdatedAtWidth] = projects.reduce((accumulator, project) => {
      const url = getProjectUrl(vars.hostUrl, orgName, project.urlName);
      const updatedAt = (new Date(project.updatedAt)).toLocaleString();
      return [
        accumulator[0] > url.length ? accumulator[0] : url.length,
        accumulator[1] > updatedAt.length ? accumulator[1] : updatedAt.length,
      ];
    }, [3, 12]);

    this.log(chalk.bold(orgName));

    CliUx.ux.table(projects, {
      name: {
        minWidth: 20,
      },
      generalAccess: {
        header: 'Access Control',
        minWidth: 20,
        get: (project) => PROJECT_SHARING_TEXT[project.generalAccessType],
      },
      url: {
        minWidth: maxUrlWidth + 2,
        get: (project) => chalk.cyan(getProjectUrl(vars.hostUrl, orgName, project.urlName)),
      },
      updatedAt: {
        minWidth: maxUpdatedAtWidth + 2,
        header: 'Last updated',
        get: (project) => (new Date(project.updatedAt)).toLocaleString(),
      },
    }, {
      printLine: this.log.bind(this),
    });

    if (!projects.length) CliUx.ux.log('', '(empty)');
  }

  showSharedProjects (sharedProjectsData) {
    const [maxOrgWidth, maxUrlWidth, maxUpdatedAtWidth, projects] = sharedProjectsData.reduce((accumulator, sharedData) => {
      const { Project: project, Role: role } = sharedData;

      const url = getProjectUrl(vars.hostUrl, project.Org.name, project.urlName);
      const updatedAt = (new Date(project.updatedAt)).toLocaleString();

      accumulator[3].push({ ...project, org: project.Org.name, role });
      return [
        accumulator[0] > project.Org.name.length ? accumulator[0] : project.Org.name.length,
        accumulator[1] > url.length ? accumulator[1] : url.length,
        accumulator[2] > updatedAt.length ? accumulator[2] : updatedAt.length,
        accumulator[3],
      ];
    }, [3, 3, 12, []]);

    this.log(chalk.bold('Shared with me'));

    CliUx.ux.table(projects, {
      name: {
        minWidth: 20,
      },
      org: {
        header: 'Owner',
        minWidth: maxOrgWidth + 2,
      },
      permission: {
        minWidth: 15,
        get: (project) => ROLE_DESCRIPTIONS[project.role.name],
      },
      url: {
        minWidth: maxUrlWidth + 2,
        get: (project) => chalk.cyan(getProjectUrl(vars.hostUrl, project.org, project.urlName)),
      },
      updatedAt: {
        minWidth: maxUpdatedAtWidth + 2,
        header: 'Last updated',
        get: (project) => (new Date(project.updatedAt)).toLocaleString(),
      },
    }, {
      printLine: this.log.bind(this),
    });

    if (!projects.length) CliUx.ux.log('', '(empty)');
  }

  async run () {
    try {
      const authConfig = await verifyToken();
      const org = await getOrg(authConfig);
      const [projects, sharedProjectsData] = await Promise.all([
        getProjectsByOrg(org.name, authConfig),
        getProjectUserRolesByOrg(org.name, authConfig),
      ]);

      this.showProjects(projects, org.name);
      this.log('\n');
      this.showSharedProjects(sharedProjectsData);
    } catch (err) {
      this.error(err);
    }
  }
}

LsCommand.description = 'list projects';

module.exports = LsCommand;
