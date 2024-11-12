const axios = require('axios');
const { vars } = require('../vars');

async function getOrg (authConfig) {
  const { data: { orgs } } = await axios.get(`${vars.apiUrl}/orgs`, authConfig);
  return orgs[0];
}
async function getProjectsByOrg (orgName, authConfig) {
  const { data: { org: { projects } } } = await axios.get(`${vars.apiUrl}/orgs/${orgName}/projects`, authConfig);
  return projects;
}
async function getProjectUserRolesByOrg (orgName, authConfig) {
  const { data } = await axios.get(`${vars.apiUrl}/orgs/${orgName}/project_user_roles`, authConfig);
  return data;
}

module.exports = {
  getOrg,
  getProjectsByOrg,
  getProjectUserRolesByOrg,
};
