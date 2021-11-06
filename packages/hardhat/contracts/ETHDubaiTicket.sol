pragma experimental ABIEncoderV2;
pragma solidity ^0.8.4;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//import "@openzeppelin/contracts/access/Ownable.sol";
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ETHDubaiTicket is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address payable public owner;
    TicketSettings public ticketSettings;
    mapping(address => Discount) public discounts;
    string private _baseURIextended;

    event Log(address indexed sender, string message);
    event LogUint(uint256 indexed tokenId, string message);
    event LogDiscount(
        address indexed sender,
        Discount discount,
        string message
    );
    event LogAttendeeInfo(
        uint256 indexed id,
        AttendeeInfo attendeeInfo,
        string message
    );
    event LogTicketAction(uint256 indexed id, bool value, string message);
    event LogResellable(
        uint256 indexed id,
        Resellable resellable,
        string message
    );
    event LogTicketSettings(
        TicketSettings indexed ticketSettings,
        string message
    );
    event LogMint(MintLog indexed mintLog, string message);
    event LogResell(ResellLog indexed resellLog, string message);

    constructor(bytes32[] memory assetsForSale)
        ERC721("ETHDubaiTicket", "ETHDUBAI")
    {
        emit Log(msg.sender, "Contract created");
        owner = payable(msg.sender);
        setBaseURI("https://ipfs.io/ipfs/");
        ticketSettings = TicketSettings(
            "early bird",
            0.1 ether,
            2 ether,
            0.2 ether,
            0.1 ether
        );
        //for (uint256 i = 0; i < assetsForSale.length; i++) {
        for (uint256 i = 0; i < 4; i++) {
            forSale[assetsForSale[i]] = true;
        }
    }

    struct Resellable {
        bool isResellable;
        uint256 price;
    }

    struct Discount {
        bool includeConf;
        bool includeWorkshops;
        bool includeWorkshopsAndPreParty;
        uint256 amount;
    }

    struct TicketSettings {
        string name;
        uint256 priceOneDay;
        uint256 priceTwoDays;
        uint256 priceThreeDays;
        uint256 priceHotel;
    }

    struct AttendeeInfo {
        string email;
        string name;
        string twitter;
        string bio;
        string job;
        string company;
        string diet;
        string tshirt;
    }

    struct MintLog {
        Discount discount;
        TicketSettings ticketSettings;
        address buyer;
        uint256 amount;
        uint256 tokenId;
        bool withHotelExtra;
    }

    struct ResellLog {
        address from;
        address to;
        uint256 tokenId;
        uint256 amount;
    }

    //this marks an item in IPFS as "forsale"
    mapping(bytes32 => bool) public forSale;
    //this lets you look up a token by the uri (assuming there is only one of each uri for now)
    mapping(bytes32 => uint256) public uriToTokenId;
    mapping(uint256 => AttendeeInfo) public _idToAttendeeInfo;
    mapping(uint256 => string) public _idToTicketCode;
    mapping(uint256 => Resellable) public _idToTicketResellable;
    mapping(uint256 => bool) public _idToScanned;
    mapping(uint256 => bool) public _idToCanceled;
    mapping(uint256 => bool) public _idToIncludeWorkshops;
    mapping(uint256 => bool) public _idToIncludeWorkshopsAndPreParty;

    function setBaseURI(string memory baseURI_) internal {
        require(msg.sender == owner, "only owner can set baseURI");
        _baseURIextended = baseURI_;
    }

    function setDiscount(
        address buyer,
        bool includeConf,
        bool includeWorkshops,
        bool includeWorkshopsAndPreParty,
        uint256 amount
    ) public returns (bool) {
        require(msg.sender == owner, "only owner can add new discounts");

        Discount memory discount = Discount(
            includeConf,
            includeWorkshops,
            includeWorkshopsAndPreParty,
            amount
        );
        emit LogDiscount(buyer, discount, "set discount buyer");
        discounts[buyer] = discount;
        return true;
    }

    function markAsScanned(uint256 id, bool scanned) public returns (bool) {
        require(msg.sender == owner, "only owner can mark as scanned");
        _idToScanned[id] = scanned;
        emit LogTicketAction(id, scanned, "scan ticket");
        return scanned;
    }

    function cancelTicket(uint256 id, bool canceled) public returns (bool) {
        require(msg.sender == owner, "only owner can cancel ticket");
        _idToCanceled[id] = canceled;
        emit LogTicketAction(id, canceled, "cancel ticket");
        return canceled;
    }

    function setTicketSettings(
        string memory name,
        uint256 pOneDay,
        uint256 pTwoDays,
        uint256 pThreeDays,
        uint256 pHotel
    ) public returns (bool) {
        require(msg.sender == owner, "only owner can set ticket settings");
        ticketSettings.name = name;
        ticketSettings.priceOneDay = pOneDay;
        ticketSettings.priceTwoDays = pTwoDays;
        ticketSettings.priceThreeDays = pThreeDays;
        ticketSettings.priceHotel = pHotel;
        emit LogTicketSettings(ticketSettings, "setTicketSettings");
        return true;
    }

    function setResellable(
        uint256 id,
        bool isResellable,
        uint256 price
    ) public returns (bool) {
        require(
            msg.sender == owner || msg.sender == this.ownerOf(id),
            "only contract owner or ticket owner can reset resell status"
        );
        Resellable memory resellable = Resellable(isResellable, price);
        _idToTicketResellable[id] = resellable;
        emit LogResellable(id, resellable, "setResellable");
        return true;
    }

    function updateAttendeeInfo(uint256 id, AttendeeInfo memory attendeeInfo)
        public
        returns (bool)
    {
        require(
            msg.sender == owner || msg.sender == this.ownerOf(id),
            "only contract owner or ticket owner can reset resell status"
        );
        _idToAttendeeInfo[id] = attendeeInfo;
        emit LogAttendeeInfo(id, attendeeInfo, "updateAttendeeInfo");
        return true;
    }

    function resell(
        address payable from,
        address to,
        uint256 tokenId
    ) public payable virtual {
        //solhint-disable-next-line max-line-length
        //        require(
        //          _isApprovedOrOwner(_msgSender(), tokenId),
        //        "ERC721: transfer caller is not owner nor approved"
        //  );
        Resellable memory resellable = _idToTicketResellable[tokenId];
        require(resellable.isResellable, "Ticket is not resellable!");
        require(msg.value >= resellable.price, "Price below selling price");
        uint256 amount = msg.value;
        uint256 coordinapeAmount = amount / 10;
        uint256 resellerAmount = amount - coordinapeAmount - 10**16;
        address payable coordinape = payable(
            address(0x579E8e014F5B2c6D7a3373fb840F8DaFeacBfae1)
        );

        coordinape.transfer(coordinapeAmount);
        from.transfer(resellerAmount);
        _transfer(from, to, tokenId);

        ResellLog memory resellLog = ResellLog(from, to, tokenId, amount);

        emit LogResell(resellLog, "resell");
    }

    function _setForSale(string[] memory tokenURIs, bool newForSale) public {
        require(msg.sender == owner, "only owner can cancel ticket");
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(tokenURIs[i]));
            forSale[uriHash] = newForSale;
        }
    }

    function getPrice() public {}

    function mintItem(
        string memory tokenURI,
        AttendeeInfo memory attendeeInfo,
        string memory ticketCode,
        Resellable memory resellable,
        bool includeWorkshops,
        bool includeWorkshopsAndPreParty,
        bool includeHotelExtra
    ) public payable returns (uint256) {
        console.log(1111);
        require(
            !(includeWorkshops && includeWorkshopsAndPreParty),
            "Can't include both workshops and workshops and pre party!"
        );
        console.log(22222);
        console.log("mm %s", msg.value);
        console.log("email %s", attendeeInfo.email);
        console.log(33333);
        Discount memory discount = discounts[msg.sender];
        uint256 amount = discounts[msg.sender].amount;
        uint256 hotelAmount = 0;
        if (amount > 0) {
            uint256 confPrice = ticketSettings.priceOneDay;
            if (discount.includeConf) {
                confPrice =
                    ticketSettings.priceOneDay -
                    ((ticketSettings.priceOneDay * amount) / 100);
            }
            if (includeHotelExtra) {
                hotelAmount = 2 * ticketSettings.priceHotel;
            }
            require(
                msg.value >= confPrice + hotelAmount,
                "Not enough ETH sent; check price!"
            );
            if (includeWorkshops) {
                uint256 twoDayPrice = ticketSettings.priceTwoDays;
                if (discount.includeWorkshops) {
                    twoDayPrice =
                        ticketSettings.priceTwoDays -
                        ((ticketSettings.priceTwoDays * amount) / 100);
                }
                if (includeHotelExtra) {
                    hotelAmount = 3 * ticketSettings.priceHotel;
                }
                require(
                    msg.value >= twoDayPrice + hotelAmount,
                    "Not enough ETH sent; check price!"
                );
            }
            if (includeWorkshopsAndPreParty) {
                uint256 threeDayPrice = ticketSettings.priceThreeDays;
                if (discount.includeWorkshopsAndPreParty) {
                    threeDayPrice =
                        ticketSettings.priceThreeDays -
                        ((ticketSettings.priceThreeDays * amount) / 100);
                }
                if (includeHotelExtra) {
                    hotelAmount = 4 * ticketSettings.priceHotel;
                }
                require(
                    msg.value >= threeDayPrice + hotelAmount,
                    "Not enough ETH sent; check price!"
                );
            }
        } else {
            amount = ticketSettings.priceOneDay;
            if (includeHotelExtra) {
                hotelAmount = 2 * ticketSettings.priceHotel;
            }
            require(
                msg.value >= ticketSettings.priceOneDay + hotelAmount,
                "Not enough ETH sent; check price!"
            );

            if (includeWorkshops) {
                if (includeHotelExtra) {
                    hotelAmount = 3 * ticketSettings.priceHotel;
                }
                amount = ticketSettings.priceTwoDays;
                require(
                    msg.value >= ticketSettings.priceTwoDays + hotelAmount,
                    "Not enough ETH sent; check price!"
                );
            }
            if (includeWorkshopsAndPreParty) {
                amount = ticketSettings.priceThreeDays;
                if (includeHotelExtra) {
                    hotelAmount = 4 * ticketSettings.priceHotel;
                }
                require(
                    msg.value >= ticketSettings.priceThreeDays + hotelAmount,
                    "Not enough ETH sent; check price!"
                );
            }
        }
        bytes32 uriHash = keccak256(abi.encodePacked(tokenURI));
        //console.log("urihash", uriHash);
        console.log("tokenURI %s", tokenURI);

        //make sure they are only minting something that is marked "forsale"
        require(forSale[uriHash], "NOT FOR SALE");
        forSale[uriHash] = false;

        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(msg.sender, id);
        _setTokenURI(id, tokenURI);

        uriToTokenId[uriHash] = id;
        _idToAttendeeInfo[id] = attendeeInfo;
        _idToTicketCode[id] = ticketCode;
        _idToTicketResellable[id] = resellable;
        _idToScanned[id] = false;
        _idToCanceled[id] = false;
        console.log(uriToTokenId[uriHash]);
        MintLog memory mintLog = MintLog(
            discount,
            ticketSettings,
            msg.sender,
            amount,
            id,
            includeHotelExtra
        );
        emit LogMint(mintLog, "mintItem");
        return id;
    }

    // Function to withdraw all Ether from this contract.
    function withdraw() public {
        // get the amount of Ether stored in this contract
        uint256 amount = address(this).balance;

        // send all Ether to owner
        // Owner can receive Ether since the address of owner is payable
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Failed to send Ether");
        emit LogUint(amount, "withdraw");
    }
}
