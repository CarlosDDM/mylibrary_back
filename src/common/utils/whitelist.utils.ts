export const whitelist = () => {
  const cors = process.env.CORS_ORIGIN;
  const allowedHosts = cors
    ?.trim()
    .split(',')
    .map((host) => host.trim());

  return allowedHosts;
};
