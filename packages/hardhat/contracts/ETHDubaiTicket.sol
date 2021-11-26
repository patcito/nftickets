pragma experimental ABIEncoderV2;
pragma solidity ^0.8.10;
//SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ETHDubaiTicket {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address payable public owner;
    address public dao1;
    address public dao2;
    address public dao3;
    uint256 public daoa;

    uint256[20] public ticketOptions;
    Settings public settings;
    event Log(address indexed sender, string message);
    event Lint(uint256 indexed tokenId, string message);
    event LMintId(address indexed sender, uint256 id, string message);
    event LDiscount(address indexed sender, Discount discount, string message);

    event LTicketAction(uint256 indexed id, bool value, string message);

    event LTicketSettings(
        TicketSettings indexed ticketSettings,
        string message
    );

    constructor() {
        emit Log(msg.sender, "created");
        owner = payable(msg.sender);
        settings.maxMint = 50;

        settings.ticketSettings = TicketSettings("early");

        ticketOptions[0] = 0.1 ether;
        ticketOptions[1] = 2 ether;
        ticketOptions[2] = 0.2 ether;
        ticketOptions[3] = 0.2 ether;
        ticketOptions[4] = 0.2 ether;
        ticketOptions[5] = 0.2 ether;
        ticketOptions[6] = 0.4 ether;
        ticketOptions[7] = 0.4 ether;
        ticketOptions[8] = 0.4 ether;
    }

    struct Discount {
        uint256[] ticketOptions;
        uint256 amount;
    }

    struct TicketSettings {
        string name;
    }
    struct MintInfo {
        string ticketCode;
        uint256 ticketOption;
        string specialStatus;
    }
    struct Settings {
        TicketSettings ticketSettings;
        uint256 maxMint;
        mapping(address => Discount) discounts;
    }

    function setDiscount(
        address buyer,
        uint256[] memory discounts,
        uint256 amount
    ) public returns (bool) {
        require(msg.sender == owner, "only owner");

        Discount memory d = Discount(discounts, amount);
        emit LDiscount(buyer, d, "set discount buyer");
        settings.discounts[buyer] = d;
        return true;
    }

    function setMaxMint(uint256 max) public returns (uint256) {
        require(msg.sender == owner, "only owner");
        settings.maxMint = max;
        emit Lint(max, "setMaxMint");
        return max;
    }

    function setTicketOptions(uint256[20] memory ticketOptionsNew)
        public
        returns (bool)
    {
        require(msg.sender == owner, "only owner");
        ticketOptions = ticketOptionsNew;
        return true;
    }

    function setDaos(
        address d1,
        address d2,
        address d3,
        uint256 a
    ) public returns (bool) {
        require(msg.sender == owner, "only owner");
        dao1 = d1;
        dao2 = d2;
        dao3 = d3;
        daoa = a;
        return true;
    }

    function setTicketSettings(string memory name) public returns (bool) {
        require(msg.sender == owner, "only owner");
        settings.ticketSettings.name = name;
        emit LTicketSettings(settings.ticketSettings, "setTicketSettings");
        return true;
    }

    function cmpStr(string memory idopt, string memory opt)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((idopt))) ==
            keccak256(abi.encodePacked((opt))));
    }

    function getPrice(address sender, uint256 ticketOption)
        public
        view
        returns (uint256)
    {
        Discount memory discount = settings.discounts[sender];
        uint256 amount = settings.discounts[sender].amount;
        uint256 total = 0;
        bool hasDiscount = false;
        total = total + ticketOptions[ticketOption];
        if (amount > 0) {
            for (uint256 j = 0; j < discount.ticketOptions.length; j++) {
                if (discount.ticketOptions[j] == ticketOption) {
                    hasDiscount = true;
                }
            }
            if (!hasDiscount) {
                amount = 0;
            }
        } else {
            address z = 0x0000000000000000000000000000000000000000;
            uint256 b = 0;
            if (dao1 != z) {
                ERC20 token = ERC20(dao1);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }
            if (amount == 0 && dao2 != z) {
                ERC20 token = ERC20(dao2);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }

            if (amount == 0 && dao3 != z) {
                ERC20 token = ERC20(dao3);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }
        }
        require(total > 0, "Total can't be 0");
        if (amount > 0) {
            total = total - ((total * amount) / 100);
        }

        return total;
    }

    function totalPrice(MintInfo[] memory mIs) public view returns (uint256) {
        uint256 t = 0;
        for (uint256 i = 0; i < mIs.length; i++) {
            t += getPrice(msg.sender, mIs[i].ticketOption);
        }
        return t;
    }

    function mintItem(MintInfo[] memory mintInfos)
        public
        payable
        returns (string memory)
    {
        require(
            _tokenIds.current() + mintInfos.length <= settings.maxMint,
            "sold out"
        );
        uint256 total = totalPrice(mintInfos);

        require(msg.value >= total, "price too low");
        string memory ids = "";
        for (uint256 i = 0; i < mintInfos.length; i++) {
            require(
                keccak256(abi.encodePacked(mintInfos[i].specialStatus)) ==
                    keccak256(abi.encodePacked("")) ||
                    msg.sender == owner,
                "only owner"
            );
            _tokenIds.increment();
        }
        return ids;
    }

    function withdraw() public {
        uint256 amount = address(this).balance;

        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "Failed");
        emit Lint(amount, "withdraw");
    }
}
