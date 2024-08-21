import { getWalletById } from './addressFactory';

const manager = getWalletById(503);
const executer = getWalletById(504);

console.log(manager.address, manager.privateKey);
console.log(executer.address, executer.privateKey);
