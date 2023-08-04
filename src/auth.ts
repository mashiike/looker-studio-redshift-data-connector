// https://developers.google.com/datastudio/connector/reference#getauthtype
export function getAuthType() {
  const cc = DataStudioApp.createCommunityConnector();
  const AuthTypes = cc.AuthType;
  return cc.newAuthTypeResponse().setAuthType(AuthTypes.NONE).build();
}

// https://developers.google.com/datastudio/connector/reference#isadminuser
export function isAdminUser() {
  return Session.getEffectiveUser().getEmail() === process.env.ADMIN_EMAIL;
}
