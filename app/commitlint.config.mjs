const config = {
  extends: ['@commitlint/config-conventional'],
  // Dependabot's generated bodies pack long URLs onto single lines, which trips
  // body-max-line-length. Its subjects are conventional by construction, so the
  // rule stays enforced for hand-written commits only.
  ignores: [message => message.includes('Signed-off-by: dependabot[bot]')],
};

export default config;
