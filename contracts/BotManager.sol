// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IERC20} from '@openzeppelin/contracts/interfaces/IERC20.sol';
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {IUniswapV3Pool} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {IUniswapV2Pair} from '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

import {SafeCast} from './lib/SafeCast.sol';
import {RouterV2Helper} from './lib/RouterV2Helper.sol';
import {BytesLib} from './lib/BytesLib.sol';
import {SafeCast} from './lib/SafeCast.sol';

interface IWhitelist {
    function isWhitelist(address user) external view returns (bool);
}

contract BotManagerV2 is AccessControl {
    using BytesLib for bytes;
    using SafeCast for uint256;

    bytes32 private constant MANAGER_ROLE = keccak256('MANAGER');
    bytes32 private constant EXECUTER_ROLE = keccak256('EXECUTER');

    IWhitelist private whitelist;
    address private pool;
    address private pair;

    // path
    address private token0;
    uint24 private fee;
    address private token1;

    address private bank;

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO =
        1461446703485210103287273052203988822378723970342;

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
        IUniswapV2Pair pairInstance = IUniswapV2Pair(_pool);
        whitelist = IWhitelist(_whitelist);
        
        // TODO: add get of version
        if (true) {
            fee = poolInstance.fee();
            token0 = poolInstance.token0();
            token1 = poolInstance.token1();
            pool = _pool;
        } else {
            token0 = pairInstance.token0();
            token1 = pairInstance.token1();
            pair = _pool;
        }
    }

    modifier IsExecuter() {
        require(isExecuter(msg.sender), 'Sender has not permissions');
        _;
    }

    function isExecuter(address user) public view returns (bool) {
        bool local = hasRole(EXECUTER_ROLE, user);
        bool remote = whitelist.isWhitelist(user);
        bool internalCall = user == address(this);
        return local || remote || internalCall;
    }

    function decodeData(
        bytes calldata inputs
    ) public pure returns (bytes calldata) {
        bytes calldata path = inputs.toBytes(3);
        return path;
    }

    function encodePath() internal view returns (bytes memory path) {
        path = abi.encodePacked(token0, fee, token1);
    }

    function getRoles() external pure returns (bytes32[3] memory) {
        return ([DEFAULT_ADMIN_ROLE, MANAGER_ROLE, EXECUTER_ROLE]);
    }

    function getPool() external view returns (address[3] memory, bytes memory) {
        return ([pool, token0, token1], encodePath());
    }

    function setPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pool = _pool;

        IUniswapV3Pool poolInstance = IUniswapV3Pool(_pool);

        token0 = poolInstance.token0();
        fee = poolInstance.fee();
        token1 = poolInstance.token1();
    }

    function grantExecuters(
        address[] memory managers
    ) external onlyRole(MANAGER_ROLE) {
        for (uint i = 0; i < managers.length; i++) {
            _grantRole(EXECUTER_ROLE, managers[i]);
        }
    }

    function revokeExecuters(
        address[] memory managers
    ) external onlyRole(MANAGER_ROLE) {
        for (uint i = 0; i < managers.length; i++) {
            _revokeRole(EXECUTER_ROLE, managers[i]);
        }
    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        require(msg.sender == pool, 'only for pool');
        swapCallback(amount0Delta, amount1Delta, data);
    }

    function pancakeV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        require(msg.sender == pool, 'only for pool');
        swapCallback(amount0Delta, amount1Delta, data);
    }

    function swapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) internal {
        if (amount0Delta <= 0 && amount1Delta <= 0) revert('delta is zero');
        bytes calldata path = data.toBytes(0);

        (address tokenIn, , address tokenOut) = path.toPool();

        (bool isExactInput, uint256 amountToPay) = amount0Delta > 0
            ? (tokenIn < tokenOut, uint256(amount0Delta))
            : (tokenOut < tokenIn, uint256(amount1Delta));

        if (isExactInput) {
            // Pay the pool (msg.sender)
            IERC20 payToken = IERC20(tokenIn);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        } else {
            if (amountToPay > maxAmountInCached)
                revert('Invalid to much requested');

            IERC20 payToken = IERC20(tokenOut);
            payToken.transferFrom(bank, msg.sender, amountToPay);
        }
    }

    function buyV3(
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external IsExecuter {
        this.buyV3(amountIn, amountOutMinimum, encodePath());
    }

    function buyV3(
        uint256 amountIn,
        uint256 amountOutMinimum,
        bytes calldata path
    ) external IsExecuter {
        (int256 amount0Delta, int256 amount1Delta, bool zeroForOne) = _swapV3(
            amountIn.toInt256(),
            bank,
            path,
            address(this),
            true
        );

        uint256 amountOut = uint256(
            -(zeroForOne ? amount1Delta : amount0Delta)
        );

        if (amountOut < amountOutMinimum) revert('Invalid to little recieved');
    }

    function sellV3(
        uint256 amountOut,
        uint256 amountInMaximum
    ) external IsExecuter {
        this.sellV3(amountOut, amountInMaximum, encodePath());
    }

    function sellV3(
        uint256 amountOut,
        uint256 amountInMaximum,
        bytes calldata path
    ) external IsExecuter {
        maxAmountInCached = amountInMaximum;

        (int256 amount0Delta, int256 amount1Delta, bool zeroForOne) = _swapV3(
            -amountOut.toInt256(),
            bank,
            path,
            address(this),
            false
        );

        uint256 amountOutReceived = zeroForOne
            ? uint256(-amount1Delta)
            : uint256(-amount0Delta);

        if (amountOutReceived != amountOut) revert('Invalid amount out');

        maxAmountInCached = DEFAULT_MAX_AMOUNT_IN;
    }

    function sellV2(
        uint256 amount1In,
        uint256 amount0OutMinimum
    ) external IsExecuter {
        IERC20(token1).transferFrom(bank, pair, amount1In);
        uint256 balanceBefore = IERC20(token0).balanceOf(bank);

        _swapV2(token1, bank);

        uint256 amountOut = IERC20(token0).balanceOf(bank) - balanceBefore;
        if (amountOut < amount0OutMinimum) revert('Invalid amount out');
    }

    function buyV2(
        uint256 amount0In,
        uint256 amount1OutMinimum
    ) external IsExecuter {
        IERC20(token0).transferFrom(bank, pair, amount0In);
        uint256 balanceBefore = IERC20(token1).balanceOf(bank);

        _swapV2(token0, bank);

        uint256 amountOut = IERC20(token1).balanceOf(bank) - balanceBefore;
        if (amountOut < amount1OutMinimum) revert('Invalid amount out');
    }

    function _swapV3(
        int256 amount,
        address recipient,
        bytes calldata path,
        address payer,
        bool isExactIn
    )
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

    function _swapV2(address input, address recipient) private {
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();
        (uint256 reserveInput, uint256 reserveOutput) = input == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        uint256 amountInput = IERC20(input).balanceOf(pair) - reserveInput;
        uint256 amountOutput = RouterV2Helper.getAmountOut(
            amountInput,
            reserveInput,
            reserveOutput
        );
        (uint256 amount0Out, uint256 amount1Out) = input == token0
            ? (uint256(0), amountOutput)
            : (amountOutput, uint256(0));
        IUniswapV2Pair(pair).swap(
            amount0Out,
            amount1Out,
            recipient,
            new bytes(0)
        );
    }
}
