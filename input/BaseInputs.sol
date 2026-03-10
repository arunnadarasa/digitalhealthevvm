// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {
    CoreStructs
} from "@evvm/testnet-contracts/library/structs/CoreStructs.sol";

abstract contract BaseInputs {
    address admin = 0xb2c0b8476c55f20EfD73721A119bB95C9D6022f2;
    address goldenFisher = 0xb2c0b8476c55f20EfD73721A119bB95C9D6022f2;
    address activator = 0xb2c0b8476c55f20EfD73721A119bB95C9D6022f2;

    CoreStructs.EvvmMetadata inputMetadata =
        CoreStructs.EvvmMetadata({
            EvvmName: "Digital Health",
            // evvmID will be set to 0, and it will be assigned when you register the evvm
            EvvmID: 0,
            principalTokenName: "Digital Health MATE",
            principalTokenSymbol: "DHM",
            principalTokenAddress: 0x0000000000000000000000000000000000000001,
            totalSupply: 2033333333000000000000000000,
            eraTokens: 1016666666500000000000000000,
            reward: 5000000000000000000
        });
}
