import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { getWalletById } from '../../scripts/addressFactory';
import { dictionary } from '../dictionary';

export default buildModule('BotManager', (m) => {
  const whitelistAddress = dictionary.addresses['whitelist'];
  const poolAddress = dictionary.addresses['pool'];
  const manager = getWalletById(1).address;

  const botManager = m.contract('BotManager', [
    whitelistAddress,
    poolAddress,
    manager,
  ]);

  return { botManager };
});
