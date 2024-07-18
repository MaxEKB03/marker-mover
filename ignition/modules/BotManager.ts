import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('BotManager', (m) => {
  const botManager = m.contract('BotManager');

  return { botManager };
});
