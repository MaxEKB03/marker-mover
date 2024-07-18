import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('TestTokens', (m) => {
  const decimals = 18;
  const amount0 = '1000000' + '0'.repeat(decimals);
  const amount1 = '1000000000000' + '0'.repeat(decimals);

  const sellToken = m.contract('ERC20', [amount0, 'USD', decimals, 'USD'], {
    id: 'SellToken',
  });
  const buyToken = m.contract('ERC20', [amount1, 'MTK', decimals, 'MTK'], {
    id: 'BuyToken',
  });

  return { sellToken, buyToken };
});
