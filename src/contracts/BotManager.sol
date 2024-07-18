// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import { SafeCast } from './lib/SafeCast.sol';
import { IERC20 } from '@openzeppelin/contracts/interfaces/IERC20.sol';
import { AccessControl } from '@openzeppelin/contracts/access/AccessControl.sol';
import { IUniswapV3Pool } from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import { BytesLib } from './lib/BytesLib.sol';
import { SafeCast } from './lib/SafeCast.sol';

contract BotManager is AccessControl {
    using BytesLib for bytes;
    using SafeCast for uint256;

    bytes32 private constant MANAGER_ROLE = keccak256("MANAGER");
    bytes32 private constant EXECUTER_ROLE = keccak256("EXECUTER");

    address private pool;
    address private token0;
    address private token1;

    address private bank;

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;
    
    function pancakeV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        require(msg.sender == pool, "only for pool");

        if (amount0Delta <= 0 && amount1Delta <= 0) revert("delta is zero"); // swaps entirely within 0-liquidity regions are not supported
        (, address payer) = abi.decode(data, (bytes, address));
        bytes calldata path = data.toBytes(0);

        (address tokenIn, uint24 fee, address tokenOut) = path.toPool();
        
        (bool isExactInput, uint256 amountToPay) =
            amount0Delta > 0 ? (tokenIn < tokenOut, uint256(amount0Delta)) : (tokenOut < tokenIn, uint256(amount1Delta));

        if (isExactInput) {
            // Pay the pool (msg.sender)
            IERC20 payToken = IERC20(tokenIn);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        } else {
            IERC20 payToken = IERC20(tokenOut);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        }
    }

    constructor(address _pool, address _manager) {
        bank = msg.sender;

        _setRoleAdmin(MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(EXECUTER_ROLE, MANAGER_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(EXECUTER_ROLE, msg.sender);

        _grantRole(MANAGER_ROLE, _manager);

        
        IUniswapV3Pool poolInstance = IUniswapV3Pool(_pool);
        
        pool = _pool;
        token0 = poolInstance.token0();
        token1 = poolInstance.token1();
    }
    
    function DecodeData(bytes calldata inputs) public pure returns(bytes calldata) {
        bytes calldata path = inputs.toBytes(3);
        return path;
    }

    function getRoles() external pure returns(bytes32[3] memory) {
        return([DEFAULT_ADMIN_ROLE, MANAGER_ROLE, EXECUTER_ROLE]);
    }

    function getPool() external view returns(address[3] memory) {
        return([pool, token0, token1]);
    }

    function setPool(address _pool) external  onlyRole(DEFAULT_ADMIN_ROLE) {
        pool = _pool;

        IUniswapV3Pool poolInstance = IUniswapV3Pool(_pool);
        token0 = poolInstance.token0();
        token1 = poolInstance.token1();
    }

    function grantExecuters(address[] memory managers) onlyRole(MANAGER_ROLE) external {
        for (uint i = 0; i < managers.length; i++) 
        {
            _grantRole(EXECUTER_ROLE, managers[i]);
        }
    }

    function revokeExecuters(address[] memory managers) onlyRole(MANAGER_ROLE) external {
        for (uint i = 0; i < managers.length; i++) 
        {
            _revokeRole(EXECUTER_ROLE, managers[i]);
        }
    }

    function buy(
        uint256 amountIn,
        uint256 amountOutMinimum,
        bytes calldata path
        ) onlyRole(EXECUTER_ROLE) external {
        _swap(
                amountIn.toInt256(),
                bank,
                path,
                address(this),
                true
            );
        // todo add slippage
    }
    
    function sell(
        uint256 amountIn,
        uint256 amountOutMinimum,
        bytes calldata path
        ) onlyRole(EXECUTER_ROLE) external {
        _swap(
                amountIn.toInt256(),
                bank,
                path,
                address(this),
                false
            );
        // todo add slippage
    }

     function _swap(int256 amount, address recipient, bytes calldata path, address payer, bool isExactIn)
            private
            returns (int256 amount0Delta, int256 amount1Delta, bool zeroForOne)
        {

        (address tokenIn, uint24 fee, address tokenOut) = path.toPool();

        zeroForOne = isExactIn ? tokenIn < tokenOut : tokenOut < tokenIn;

        (amount0Delta, amount1Delta) = IUniswapV3Pool(pool).swap(
            recipient,
            zeroForOne,
            amount,
            (zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1),
            abi.encode(path, payer)
        );
    }
   
}
