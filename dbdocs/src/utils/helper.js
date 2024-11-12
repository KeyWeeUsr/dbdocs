const getIsPublicValueFromBuildFlag = (publicFlag, privateFlag, passwordFlag) => {
  if (publicFlag || passwordFlag) return true;
  if (privateFlag) return false;
  return undefined; // 'undefined' means keep the old `isPublic` state
};
const getProjectUrl = (hostUrl, orgName, projectUrl) => `${hostUrl}/${encodeURIComponent(orgName)}/${projectUrl}`;

module.exports = {
  getIsPublicValueFromBuildFlag,
  getProjectUrl,
};
