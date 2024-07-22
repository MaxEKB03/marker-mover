// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import { SafeCast } from './lib/SafeCast.sol';
import { IERC20 } from '@openzeppelin/contracts/interfaces/IERC20.sol';
import { AccessControl } from '@openzeppelin/contracts/access/AccessControl.sol';
import { IUniswapV3Pool } from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import { BytesLib } from './lib/BytesLib.sol';
import { SafeCast } from './lib/SafeCast.sol';

interface IWhitelist {
    function isWhitelist(address user) external view returns(bool);
}

contract BotManager is AccessControl {
    using BytesLib for bytes;
    using SafeCast for uint256;

    bytes32 private constant MANAGER_ROLE = keccak256("MANAGER");
    bytes32 private constant EXECUTER_ROLE = keccak256("EXECUTER");

    IWhitelist private whitelist;
    address private pool;

    // path
    address private token0;
    uint24 private fee;
    address private token1;

    address private bank;

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;
    
    uint256 private constant DEFAULT_MAX_AMOUNT_IN = type(uint256).max;
    uint256 private maxAmountInCached = DEFAULT_MAX_AMOUNT_IN;

    constructor(address _whitelist, address _pool, address _manager) {
        bank = msg.sender;

        _setRoleAdmin(MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(EXECUTER_ROLE, MANAGER_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(EXECUTER_ROLE, msg.sender);

        _grantRole(MANAGER_ROLE, _manager);

        
        IUniswapV3Pool poolInstance = IUniswapV3Pool(_pool);
        
        whitelist = IWhitelist(_whitelist);
        pool = _pool;
        fee = poolInstance.fee();
        token0 = poolInstance.token0();
        token1 = poolInstance.token1();
    }
    
    modifier IsExecuter() {
        bool local = hasRole(EXECUTER_ROLE, msg.sender);
        bool remote = whitelist.isWhitelist(msg.sender);
        require(local || remote, "Sender has not permissions");
        _;
    }

    function decodeData(bytes calldata inputs) public pure returns(bytes calldata) {
        bytes calldata path = inputs.toBytes(3);
        return path;
    }

    function encodePath() internal view returns(bytes memory path) {
        path = abi.encodePacked(token0, fee, token1);
    }

    function getRoles() external pure returns(bytes32[3] memory) {
        return([DEFAULT_ADMIN_ROLE, MANAGER_ROLE, EXECUTER_ROLE]);
    }

    function getPool() external view returns(address[3] memory, bytes memory) {
        return([pool, token0, token1], encodePath());
    }

    function setPool(address _pool) external  onlyRole(DEFAULT_ADMIN_ROLE) {
        pool = _pool;

        IUniswapV3Pool poolInstance = IUniswapV3Pool(_pool);

        token0 = poolInstance.token0();
        fee = poolInstance.fee();
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

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        require(msg.sender == pool, "only for pool");
        swapCallback(amount0Delta, amount1Delta, data);
    }

    function pancakeV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        require(msg.sender == pool, "only for pool");
        swapCallback(amount0Delta, amount1Delta, data);
    }

    function swapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) internal {
        if (amount0Delta <= 0 && amount1Delta <= 0) revert("delta is zero");
        bytes calldata path = data.toBytes(0);

        (address tokenIn, , address tokenOut) = path.toPool();
        
        (bool isExactInput, uint256 amountToPay) =
            amount0Delta > 0 ? (tokenIn < tokenOut, uint256(amount0Delta)) : (tokenOut < tokenIn, uint256(amount1Delta));

        if (isExactInput) {
            // Pay the pool (msg.sender)
            IERC20 payToken = IERC20(tokenIn);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        } else {
            if (amountToPay > maxAmountInCached) revert('Invalid to much requested');

            IERC20 payToken = IERC20(tokenOut);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        }
    }
    
    function buy(uint256 amountIn, uint256 amountOutMinimum) onlyRole(EXECUTER_ROLE) external {
        this.buy(amountIn, amountOutMinimum, encodePath());
    }

    function buy(uint256 amountIn, uint256 amountOutMinimum, bytes calldata path) onlyRole(EXECUTER_ROLE) external {
        (int256 amount0Delta, int256 amount1Delta, bool zeroForOne) = _swap(
            amountIn.toInt256(),
            bank,
            path,
            address(this),
            true
        );

        uint256 amountOut = uint256(-(zeroForOne ? amount1Delta : amount0Delta));

        if (amountOut < amountOutMinimum) revert('Invalid to little recieved');
    }
    
    function sell(uint256 amountOut, uint256 amountInMaximum) onlyRole(EXECUTER_ROLE) external {
        this.sell(amountOut, amountInMaximum, encodePath());
    }

    function sell(uint256 amountOut, uint256 amountInMaximum, bytes calldata path) onlyRole(EXECUTER_ROLE) external {
        maxAmountInCached = amountInMaximum;

        (int256 amount0Delta, int256 amount1Delta, bool zeroForOne) =
            _swap(-amountOut.toInt256(), bank, path, address(this), false);

        uint256 amountOutReceived = zeroForOne ? uint256(-amount1Delta) : uint256(-amount0Delta);

        if (amountOutReceived != amountOut) revert('Invalid amount out');

        maxAmountInCached = DEFAULT_MAX_AMOUNT_IN;
    }

     function _swap(int256 amount, address recipient, bytes calldata path, address payer, bool isExactIn)
            private
            returns (int256 amount0Delta, int256 amount1Delta, bool zeroForOne)
        {
        (address tokenIn, , address tokenOut) = path.toPool();

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
