const axios = require('axios');
const { vars } = require('../vars');

async function getOrg (authConfig) {
  const { data: { orgs } } = await axios.get(`${vars.apiUrl}/orgs`, authConfig);
  return orgs[0];
}

module.exports = {
  getOrg,
};
