import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('TestTokens', (m) => {
  const sellToken = m.contract('ERC20', ['1000000000000', 'USD', '6', 'USD'], {
    id: 'SellToken',
  });
  const buyToken = m.contract('ERC20', ['1000000000000', 'MTK', '6', 'MTK'], {
    id: 'BuyToken',
  });

  return { sellToken, buyToken };
});
