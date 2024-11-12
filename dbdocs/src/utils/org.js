const axios = require('axios');
const { vars } = require('../vars');

async function getOrg (authToken) {
  const { data: { orgs } } = await axios.get(`${vars.apiUrl}/orgs`, {
    headers: {
      Authorization: authToken,
    },
  });
  return orgs[0];
}

module.exports = {
  getOrg,
};
