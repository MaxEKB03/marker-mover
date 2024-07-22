import { ignition } from 'hardhat';
import BotManager from '../../ignition/modules/BotManager';

export async function deployManager() {
  const { botManager } = await ignition.deploy(BotManager);
  return { botManager };
}
