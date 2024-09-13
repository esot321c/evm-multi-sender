// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiSender is Ownable {
    constructor() Ownable(msg.sender) {}

    function multiSendToken(
        IERC20 token,
        address[] memory recipients,
        uint256[] memory amounts
    ) external {
        require(recipients.length == amounts.length, "Arrays must have the same length");
        
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        require(token.transferFrom(msg.sender, address(this), total), "Transfer failed");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(token.transfer(recipients[i], amounts[i]), "Transfer failed");
        }
    }

    function multiSendEth(
        address payable[] memory recipients,
        uint256[] memory amounts
    ) external payable {
        require(recipients.length == amounts.length, "Arrays must have the same length");
        
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        require(msg.value == total, "Incorrect ETH amount sent");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = recipients[i].call{value: amounts[i]}("");
            require(success, "ETH transfer failed");
        }
    }
}