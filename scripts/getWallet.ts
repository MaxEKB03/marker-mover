import { getWalletById } from './addressFactory';

// const manager = getWalletById(0);
// const manager = getWalletById(505);
// const manager = getWalletById(1015);
// const manager = getWalletById(1521);
// const manager = getWalletById(2035);
const manager = getWalletById(2600);

console.log(manager.address, manager.privateKey);
