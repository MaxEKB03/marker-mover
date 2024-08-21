// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract Whitelist is Ownable {
    constructor() Ownable(msg.sender) {}

    mapping(address => bool) private whitelist;

    function grant(address[] memory users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            whitelist[users[i]] = true;
        }
    }

    function revoke(address[] memory users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            whitelist[users[i]] = false;
        }
    }

    function isWhitelist(address user) external view returns (bool) {
        return whitelist[user];
    }
}
