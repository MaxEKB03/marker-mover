import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('Whitelist', (m) => {
  const whitelist = m.contract('Whitelist');

  return { whitelist };
});
