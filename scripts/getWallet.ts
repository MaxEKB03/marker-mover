import { map } from 'rxjs';
import { getWalletById } from './addressFactory';

// const manager = getWalletById(0);
// const manager = getWalletById(505);
// const manager = getWalletById(1015);
// const manager = getWalletById(1521);
// const manager = getWalletById(2035);
// const manager = getWalletById(2600);
const ids = [2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044];
const managers = ids.map((id) => getWalletById(id));

// console.log(manager.address, manager.privateKey);
console.log(
  'public',
  managers.map((wallet) => wallet.address),
);
console.log(
  'private',
  managers.map((wallet) => wallet.privateKey),
);

// `0x8ce6B0bf8b6371322a3e0C4b99e4BEA226b8150D`
// `0x88c1b5Eb5a11488D14B98b7E724Ae748fecA0476`
// `0xCDB85A3f0FAeeF75Db59FCDA62E443b38977f24e`
// `0x0090E9Bd38C7dF86104BaE9AAaa35c7e3E9C2796`
// `0xe9a7daA32E677029B5F6F71d72d08Da7fB5502EA`
// `0x5537e9a7D23487FAA3a2c41a0D95c01e25e9396b`
// `0xE7c2D379811671dF89BaBAbF0970F445D16Ba7Ac`
// `0x0CbeB811A67F56Ad3E1897F70a457C332d85F008`
// `0x7816C5C57c66f2869F4c3e9273583028a960C727`
