const updateNotifier = require('update-notifier');
const pkg = require('../../../package.json');

module.exports = async function () {
  updateNotifier({ pkg }).notify({ isGlobal: true });
};
