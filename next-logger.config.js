const pino = require("pino");

const logger = (defaultConfig) =>
  pino({
    ...defaultConfig,
    mixin: () => ({ app: "besu-blockchain-explorer" }),
  });

module.exports = { logger };
