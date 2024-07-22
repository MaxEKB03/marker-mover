import { ignition } from 'hardhat';
import Whitelist from '../../ignition/modules/Whitelist';

export async function deployWhitelist() {
  const { whitelist } = await ignition.deploy(Whitelist);
  return { whitelist };
}
