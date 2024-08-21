// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IUniswapV3Pool} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';

contract Test {
    IUniswapV3Pool public pool;

    constructor(address _pool) {
        pool = IUniswapV3Pool(_pool);
    }

    function encodePath() public view returns (bytes memory) {
        address token0 = pool.token0();
        uint24 fee = pool.fee();
        address token1 = pool.token1();

        return abi.encodePacked(token0, fee, token1);
    }
}
