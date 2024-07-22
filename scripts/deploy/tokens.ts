import { ignition } from 'hardhat';
import TestTokens from '../../ignition/modules/TestTokens';

export async function deployTokens() {
  const { buyToken, sellToken } = await ignition.deploy(TestTokens);
  return { buyToken, sellToken };
}
