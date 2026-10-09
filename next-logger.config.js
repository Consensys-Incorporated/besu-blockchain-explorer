const pino = require("pino");

const logger = (defaultConfig) =>
  pino({
    ...defaultConfig,
    mixin: () => ({ app: "besu-explorer" }),
  });

module.exports = { logger };
