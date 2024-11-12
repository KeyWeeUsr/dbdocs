const netrc = require('netrc-parser').default;
const axios = require('axios');
const { vars } = require('../vars');

const verifyToken = async () => {
  const { apiHost } = vars;
  await netrc.load();
  const previousEntry = netrc.machines[apiHost];
  if (!previousEntry || !previousEntry.password) {
    throw new Error('Please login first.');
  }
  const authToken = netrc.machines[apiHost].password;
  await axios.get(`${vars.apiUrl}/account`, {
    headers: {
      Authorization: authToken,
    },
  });
  return authToken;
};

module.exports = verifyToken;
