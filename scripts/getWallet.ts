import { getWalletById } from './addressFactory';

// const manager = getWalletById(503);
// const executer = getWalletById(504);
const manager = getWalletById(505);

console.log(manager.address, manager.privateKey);
// console.log(executer.address, executer.privateKey);
