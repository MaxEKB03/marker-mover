import { getDeployed } from '../scripts/getDeployed';

class Dictionary {
  addresses: { [key: string]: string } = {};

  constructor() {
    const deployed = getDeployed();
    this.addresses['pool'] = deployed['Pool#Pancake'];
    this.addresses['whitelist'] = deployed['Whitelist#Whitelist'];
  }
}

export const dictionary = new Dictionary();
