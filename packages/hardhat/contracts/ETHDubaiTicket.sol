pragma experimental ABIEncoderV2;
pragma solidity ^0.8.4;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./HexStrings.sol";
import "./ToColor.sol";
import "base64-sol/base64.sol";

//import "@openzeppelin/contracts/access/Ownable.sol";
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ETHDubaiTicket is ERC721URIStorage {
    using Strings for uint256;
    using HexStrings for uint160;
    using ToColor for bytes3;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address payable public owner;
    Settings public settings;
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

    constructor() ERC721("ETHDubaiTicket", "ETHDUBAI") {
        emit Log(msg.sender, "Contract created");
        owner = payable(msg.sender);
        settings.maxMint = 1;

        settings.ticketSettings = TicketSettings(
            "early bird",
            0.1 ether,
            2 ether,
            0.2 ether,
            0.1 ether
        );
        //for (uint256 i = 0; i < assetsForSale.length; i++) {
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
    struct Settings {
        TicketSettings ticketSettings;
        uint256 maxMint;
        mapping(address => Discount) discounts;
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
        string telegram;
    }

    struct Colors {
        bytes3 color1;
        bytes3 color2;
        bytes3 color3;
        bytes3 color4;
        bytes3 color5;
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

    struct MintInfo {
        AttendeeInfo attendeeInfo;
        string ticketCode;
        Resellable resellable;
        bool includeWorkshops;
        bool includeWorkshopsAndPreParty;
        bool includeHotelExtra;
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
    mapping(uint256 => bool) public _idToIncludeHotel;
    mapping(uint256 => Colors) public _idToColors;

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
        settings.discounts[buyer] = discount;
        return true;
    }

    function setMaxMint(uint256 newMaxMint) public returns (uint256) {
        require(msg.sender == owner, "only owner can mark as scanned");
        settings.maxMint = newMaxMint;
        emit LogUint(newMaxMint, "setMaxMint");
        return newMaxMint;
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
        settings.ticketSettings.name = name;
        settings.ticketSettings.priceOneDay = pOneDay;
        settings.ticketSettings.priceTwoDays = pTwoDays;
        settings.ticketSettings.priceThreeDays = pThreeDays;
        settings.ticketSettings.priceHotel = pHotel;
        emit LogTicketSettings(settings.ticketSettings, "setTicketSettings");
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

    function getPrice(
        address sender,
        bool includeWorkshops,
        bool includeWorkshopsAndPreParty,
        bool includeHotelExtra
    ) public view returns (uint256) {
        Discount memory discount = settings.discounts[sender];
        uint256 amount = settings.discounts[sender].amount;
        uint256 hotelAmount = 0;
        uint256 total = 0;
        if (amount > 0) {
            uint256 confPrice = settings.ticketSettings.priceOneDay;
            if (discount.includeConf) {
                confPrice =
                    settings.ticketSettings.priceOneDay -
                    ((settings.ticketSettings.priceOneDay * amount) / 100);
            }
            if (includeHotelExtra) {
                hotelAmount = 2 * settings.ticketSettings.priceHotel;
            }

            total = confPrice + hotelAmount;
            if (includeWorkshops) {
                uint256 twoDayPrice = settings.ticketSettings.priceTwoDays;
                if (discount.includeWorkshops) {
                    twoDayPrice =
                        settings.ticketSettings.priceTwoDays -
                        ((settings.ticketSettings.priceTwoDays * amount) / 100);
                }
                if (includeHotelExtra) {
                    hotelAmount = 3 * settings.ticketSettings.priceHotel;
                }

                total = twoDayPrice + hotelAmount;
            }
            if (includeWorkshopsAndPreParty) {
                uint256 threeDayPrice = settings.ticketSettings.priceThreeDays;
                if (discount.includeWorkshopsAndPreParty) {
                    threeDayPrice =
                        settings.ticketSettings.priceThreeDays -
                        ((settings.ticketSettings.priceThreeDays * amount) /
                            100);
                }
                if (includeHotelExtra) {
                    hotelAmount = 4 * settings.ticketSettings.priceHotel;
                }

                total = threeDayPrice + hotelAmount;
            }
        } else {
            if (includeHotelExtra) {
                hotelAmount = 2 * settings.ticketSettings.priceHotel;
            }

            total = settings.ticketSettings.priceOneDay + hotelAmount;

            if (includeWorkshops) {
                if (includeHotelExtra) {
                    hotelAmount = 3 * settings.ticketSettings.priceHotel;
                }

                total = settings.ticketSettings.priceTwoDays + hotelAmount;
            }
            if (includeWorkshopsAndPreParty) {
                if (includeHotelExtra) {
                    hotelAmount = 4 * settings.ticketSettings.priceHotel;
                }

                total = settings.ticketSettings.priceThreeDays + hotelAmount;
            }
        }
        /* if (amount == 0) {
            address devdao = 0xb3067e47d005f9A588162A710071d18098c93E04;
            bool ddBalance = devdao.call(
                bytes4(sha3("balanceOf(address)")),
                sender
            );
        }*/
        console.log("total.sol", total);
        return total;
    }

    function processMintIntem(
        MintInfo memory mintInfo,
        address sender,
        uint256 value
    ) internal returns (uint256) {
        require(
            !(mintInfo.includeWorkshops &&
                mintInfo.includeWorkshopsAndPreParty),
            "Can't include both workshops and workshops and pre party!"
        );
        console.log(22222);
        console.log("mm %s", value);
        console.log("email %s", mintInfo.attendeeInfo.email);
        console.log(33333);
        uint256 total;
        Discount memory discount = settings.discounts[sender];

        //console.log("urihash", uriHash);

        //make sure they are only minting something that is marked "forsale"

        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(sender, id);
        bytes32 predictableRandom1 = keccak256(
            abi.encodePacked(
                blockhash(block.number + 1),
                sender,
                address(this),
                "foo1"
            )
        );
        _idToColors[id].color1 =
            bytes2(predictableRandom1[0]) |
            (bytes2(predictableRandom1[1]) >> 8) |
            (bytes3(predictableRandom1[2]) >> 16);

        bytes32 predictableRandom2 = keccak256(
            abi.encodePacked(
                blockhash(block.number + 2),
                sender,
                address(this),
                "foo2"
            )
        );
        _idToColors[id].color2 =
            bytes2(predictableRandom2[0]) |
            (bytes2(predictableRandom2[1]) >> 8) |
            (bytes3(predictableRandom2[2]) >> 16);

        bytes32 predictableRandom3 = keccak256(
            abi.encodePacked(
                blockhash(block.number + 3),
                sender,
                address(this),
                "foo3"
            )
        );
        _idToColors[id].color3 =
            bytes2(predictableRandom3[0]) |
            (bytes2(predictableRandom3[1]) >> 8) |
            (bytes3(predictableRandom3[2]) >> 16);

        bytes32 predictableRandom4 = keccak256(
            abi.encodePacked(
                blockhash(block.number + 4),
                sender,
                address(this),
                "foo4"
            )
        );
        _idToColors[id].color4 =
            bytes2(predictableRandom4[0]) |
            (bytes2(predictableRandom4[1]) >> 8) |
            (bytes3(predictableRandom4[2]) >> 16);

        bytes32 predictableRandom5 = keccak256(
            abi.encodePacked(
                blockhash(block.number + 50),
                sender,
                address(this),
                "foo5"
            )
        );
        _idToColors[id].color5 =
            bytes2(predictableRandom5[0]) |
            (bytes2(predictableRandom5[1]) >> 8) |
            (bytes3(predictableRandom5[2]) >> 16);

        _idToAttendeeInfo[id] = mintInfo.attendeeInfo;
        _idToTicketCode[id] = mintInfo.ticketCode;
        _idToTicketResellable[id] = mintInfo.resellable;
        _idToScanned[id] = false;
        _idToCanceled[id] = false;
        _idToIncludeWorkshops[id] = mintInfo.includeWorkshops;
        _idToIncludeWorkshopsAndPreParty[id] = mintInfo
            .includeWorkshopsAndPreParty;
        _idToIncludeHotel[id] = mintInfo.includeHotelExtra;

        MintLog memory mintLog = MintLog(
            discount,
            settings.ticketSettings,
            sender,
            total,
            id,
            mintInfo.includeHotelExtra
        );
        emit LogMint(mintLog, "mintItem");
        return id;
    }

    function mintItem(MintInfo[] memory mintInfos)
        public
        payable
        returns (bool)
    {
        require(
            _tokenIds.current() < settings.maxMint,
            "sorry, we're sold out!"
        );
        uint256 total = 0;
        for (uint256 i = 0; i < mintInfos.length; i++) {
            total += getPrice(
                msg.sender,
                mintInfos[i].includeWorkshops,
                mintInfos[i].includeWorkshopsAndPreParty,
                mintInfos[i].includeHotelExtra
            );
        }
        require(msg.value >= total, "Not enough ETH sent; check price!");

        for (uint256 i = 0; i < mintInfos.length; i++) {
            processMintIntem(mintInfos[i], msg.sender, msg.value);
        }

        return true;
    }

    function generateSVGofTokenById(uint256 id)
        internal
        view
        returns (string memory)
    {
        string memory preEvent1;
        string memory preEvent2;
        string memory preEvent3;
        if (_idToIncludeWorkshops[id]) {
            preEvent1 = "Workshops";
            if (_idToIncludeHotel[id]) {
                preEvent2 = "Hotel";
            }
        } else if (_idToIncludeWorkshopsAndPreParty[id]) {
            preEvent1 = "Workshops";
            preEvent2 = "Preparties";
            if (_idToIncludeHotel[id]) {
                preEvent3 = "Hotel";
            }
        }
        string memory svg = string(
            abi.encodePacked(
                '<svg width="606" height="334" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(0.72064248,0,0,0.72064248,17.906491,14.009434)"><polygon fill="#',
                renderTokenById(id),
                '" points="0.0009,212.3208 127.9609,287.9578 127.9609,154.1588 " /></g><text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="143.01178" >Conference</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="182.54297">',
                preEvent1,
                '</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="222.82584">',
                preEvent2,
                '</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="266.28345">',
                preEvent3,
                '</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="87.164688">#1</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="315.82971">@',
                _idToAttendeeInfo[id].telegram,
                '</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="39.293556">ETHDubai Ticket</text><rect style="fill:none;stroke:#000000;stroke-width:3.0572;stroke-miterlimit:4;stroke-dasharray:none" id="rect2950" width="602.97424" height="331.64685" x="0" y="0" ry="10.078842" /></svg>'
            )
        );

        return svg;
    }

    // Visibility is `public` to enable it being called by other contracts for composition.
    function renderTokenById(uint256 id) public view returns (string memory) {
        string memory render = string(
            abi.encodePacked(
                _idToColors[id].color1.toColor(),
                '" points="255.9231,212.32 127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 " /><polygon fill="#',
                _idToColors[id].color2.toColor(),
                '" points="0,212.32 127.962,287.959 127.962,154.158 127.962,0 " /><polygon fill="#',
                _idToColors[id].color3.toColor(),
                '" points="255.9991,236.5866 127.9611,312.1866 126.3861,314.1066 126.3861,412.3056 127.9611,416.9066 " /> <polygon fill="#',
                _idToColors[id].color2.toColor(),
                '" points="127.962,416.9052 127.962,312.1852 0,236.5852 " /><polygon fill="#',
                _idToColors[id].color4.toColor(),
                '" points="127.9611,287.9577 255.9211,212.3207 127.9611,154.1587 " /><polygon fill="#',
                _idToColors[id].color5.toColor()
            )
        );

        return render;
    }

    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "not exist");
        string memory name = string(
            abi.encodePacked("ETHDubai Ticket #", id.toString())
        );
        string memory description = string(
            abi.encodePacked("This is a ticket to ETHDubai conference 2021.")
        );
        console.log("svg %s", generateSVGofTokenById(id));
        string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));
        string memory hasWorkshops = "false";
        string memory hasHotel = "false";
        if (_idToIncludeWorkshops[id]) {
            hasWorkshops = "true";
        }
        if (_idToIncludeHotel[id]) {
            hasHotel = "true";
        }

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name,
                                '", "description":"',
                                description,
                                '", "external_url":"https://www.ethdubaiconf.org/token/',
                                id.toString(),
                                '", "attributes": [{"trait_type": "workshops", "value": "',
                                hasWorkshops,
                                '"},{"trait_type": "hotel", "value": "',
                                hasHotel,
                                '"}], "owner":"',
                                (uint160(ownerOf(id))).toHexString(20),
                                '", "image": "data:image/svg+xml;base64,',
                                image,
                                '"}'
                            )
                        )
                    )
                )
            );
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
