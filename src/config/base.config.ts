import { fillFromEnv, types } from './dto/config.dto';

const config = {
  DEFAULT_NETWORK: types.string,
  JSON_RPC_MAINNET: types.string,
  JSON_RPC_TESTNET: types.string,
  MNEMONIC: types.string,
  PORT: types.number,
};

fillFromEnv(config);

export default config;
