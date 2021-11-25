pragma experimental ABIEncoderV2;
pragma solidity ^0.8.10;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "./HexStrings.sol";
import "./ToColor.sol";
import "base64-sol/base64.sol";

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ETHDubaiTicket is ERC721URIStorage {
    using Strings for uint256;
    using HexStrings for uint160;
    using ToColor for bytes3;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address payable public owner;
    address public dao1;
    address public dao2;
    address public dao3;
    uint256 public daoa;
    ERC20 public erc20;
    Settings public settings;
    event Log(address indexed sender, string message);
    event Lint(uint256 indexed tokenId, string message);
    event LMintId(address indexed sender, uint256 id, string message);
    event LDiscount(address indexed sender, Discount discount, string message);
    event LAttendeeInfo(
        uint256 indexed id,
        AttendeeInfo attendeeInfo,
        string message
    );
    event LTicketAction(uint256 indexed id, bool value, string message);
    event LResellable(
        uint256 indexed id,
        Resellable resellable,
        string message
    );
    event LTicketSettings(
        TicketSettings indexed ticketSettings,
        string message
    );
    event LMint(MintLog indexed mintLog, string message);
    event LResell(ResellLog indexed resellLog, string message);

    constructor() ERC721("ETHDubaiTicket", "ETHDUBAI") {
        emit Log(msg.sender, "created");
        owner = payable(msg.sender);
        settings.maxMint = 50;

        erc20 = ERC20(0x6244D7f9245ad590490338db2fbEd815c2358034);

        settings.ticketSettings = TicketSettings("early bird");

        settings.ticketOptionPrices["conference"] = 0.1 ether;
        settings.ticketOptionPrices["workshop"] = 2 ether;
        settings.ticketOptionPrices["workshopAndPreParty"] = 0.2 ether;
        settings.ticketOptionPrices["hotelConference"] = 0.2 ether;
        settings.ticketOptionPrices["hotelWorkshops"] = 2.15 ether;
        settings.ticketOptionPrices["hotelWorkshopsAndPreParty"] = 0.4 ether;
    }

    struct Resellable {
        bool isResellable;
        uint256 price;
    }

    struct Discount {
        string[] ticketOptions;
        uint256 amount;
    }

    struct TicketSettings {
        string name;
    }

    struct Settings {
        TicketSettings ticketSettings;
        uint256 maxMint;
        mapping(address => Discount) discounts;
        mapping(string => uint256) ticketOptionPrices;
    }
    struct AttendeeInfo {
        string email;
        string fname;
        string lname;
        string twitter;
        string bio;
        string job;
        string company;
        string workshop;
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
        string ticketOption;
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
        string ticketOption;
        string specialStatus;
        Resellable resellable;
    }

    mapping(uint256 => AttendeeInfo) public _idToAttendeeInfo;
    mapping(uint256 => string) public _idToTicketCode;
    mapping(uint256 => Resellable) public _idToTicketResellable;
    mapping(uint256 => bool) public _idToScanned;
    mapping(uint256 => bool) public _idToCanceled;
    mapping(uint256 => Colors) public _idToColors;
    mapping(uint256 => string) public _idToTicketOption;
    mapping(uint256 => string) public _idToSpecialStatus;

    function setDiscount(
        address buyer,
        string[] memory discounts,
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

    function markAsScannedCanceld(
        uint256 id,
        bool scan,
        bool canceled
    ) public returns (bool) {
        require(msg.sender == owner, "only owner");
        _idToScanned[id] = scan;
        _idToCanceled[id] = canceled;
        emit LTicketAction(id, scan, "scan");
        emit LTicketAction(id, canceled, "cancel");
        return scan;
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

    function setTicketOption(string memory name, uint256 amount)
        public
        returns (bool)
    {
        require(msg.sender == owner, "only owner");
        settings.ticketOptionPrices[name] = amount;
        return true;
    }

    function setTicketSettings(string memory name, address e2)
        public
        returns (bool)
    {
        require(msg.sender == owner, "only owner");
        settings.ticketSettings.name = name;
        erc20 = ERC20(e2);
        emit LTicketSettings(settings.ticketSettings, "setTicketSettings");
        return true;
    }

    function setResellable(
        uint256 id,
        bool isResellable,
        uint256 price
    ) public returns (bool) {
        require(msg.sender == this.ownerOf(id), "only owner");
        Resellable memory resellable = Resellable(isResellable, price);
        _idToTicketResellable[id] = resellable;
        emit LResellable(id, resellable, "setResellable");
        return true;
    }

    function updateAttendeeInfo(uint256 id, AttendeeInfo memory attendeeInfo)
        public
        returns (bool)
    {
        require(
            msg.sender == owner || msg.sender == this.ownerOf(id),
            "only contract or ticket owner"
        );
        _idToAttendeeInfo[id] = attendeeInfo;
        emit LAttendeeInfo(id, attendeeInfo, "updateAttendeeInfo");
        return true;
    }

    function resell(uint256 tokenId) public payable virtual {
        Resellable memory resellable = _idToTicketResellable[tokenId];
        require(resellable.isResellable, "not for sale");

        uint256 amount = resellable.price;
        uint256 fee = amount / 20;
        uint256 resellerAmount = amount - fee;
        address payable reseller = payable(address(ownerOf(tokenId)));
        require(erc20.transferFrom(msg.sender, reseller, resellerAmount));
        require(erc20.transferFrom(msg.sender, address(this), fee));

        _transfer(ownerOf(tokenId), msg.sender, tokenId);
        resellable.isResellable = false;
        _idToTicketResellable[tokenId] = resellable;
        ResellLog memory resellL = ResellLog(
            ownerOf(tokenId),
            msg.sender,
            tokenId,
            amount
        );
        emit LResell(resellL, "resell");
    }

    function getPrice(address sender, string memory ticketOption)
        public
        view
        returns (uint256)
    {
        Discount memory discount = settings.discounts[sender];
        uint256 amount = settings.discounts[sender].amount;
        uint256 total = 0;
        bool hasDiscount = false;
        total = total + settings.ticketOptionPrices[ticketOption];
        if (amount > 0) {
            for (uint256 j = 0; j < discount.ticketOptions.length; j++) {
                string memory a = discount.ticketOptions[j];
                string memory b = ticketOption;
                if (
                    (keccak256(abi.encodePacked((a))) ==
                        keccak256(abi.encodePacked((b))))
                ) {
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
                ERC721 token = ERC721(dao1);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }
            if (amount == 0 && dao2 != z) {
                ERC721 token = ERC721(dao2);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }

            if (amount == 0 && dao3 != z) {
                ERC721 token = ERC721(dao3);
                b = token.balanceOf(msg.sender);
                if (b > 0) amount = daoa;
            }
        }
        require(total > 0, "Total can't be 0");
        if (hasDiscount || amount > 0) {
            total = total - ((total * amount) / 100);
        }

        return total;
    }

    function genColor(bytes32 pr) internal pure returns (bytes3) {
        bytes3 color = bytes2(pr[0]) |
            (bytes2(pr[1]) >> 8) |
            (bytes3(pr[2]) >> 16);
        return color;
    }

    function genPredictable(
        address sender,
        address that,
        bytes32 blockNum,
        string memory attendeeProp
    ) internal pure returns (bytes32) {
        return
            keccak256(abi.encodePacked(blockNum, sender, that, attendeeProp));
    }

    function processMintIntem(MintInfo memory mintInfo, address sender)
        internal
        returns (uint256)
    {
        uint256 total;
        Discount memory discount = settings.discounts[sender];

        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(sender, id);
        bytes32 predictableRandom1 = genPredictable(
            sender,
            address(this),
            blockhash(block.number + 1),
            mintInfo.attendeeInfo.email
        );

        _idToColors[id].color1 = genColor(predictableRandom1);

        bytes32 predictableRandom2 = genPredictable(
            sender,
            address(this),
            blockhash(block.number + 2),
            mintInfo.attendeeInfo.telegram
        );

        _idToColors[id].color2 = genColor(predictableRandom2);

        bytes32 predictableRandom3 = genPredictable(
            sender,
            address(this),
            blockhash(block.number + 3),
            mintInfo.attendeeInfo.fname
        );

        _idToColors[id].color3 = genColor(predictableRandom3);

        bytes32 predictableRandom4 = genPredictable(
            sender,
            address(this),
            blockhash(block.number + 4),
            mintInfo.attendeeInfo.lname
        );

        _idToColors[id].color4 = genColor(predictableRandom4);

        bytes32 predictableRandom5 = genPredictable(
            sender,
            address(this),
            blockhash(block.number + 50),
            "foo5"
        );

        _idToColors[id].color5 = genColor(predictableRandom5);

        _idToAttendeeInfo[id] = mintInfo.attendeeInfo;
        _idToTicketCode[id] = mintInfo.ticketCode;
        _idToTicketResellable[id] = mintInfo.resellable;
        _idToScanned[id] = false;
        _idToCanceled[id] = false;
        _idToTicketOption[id] = mintInfo.ticketOption;

        MintLog memory mintLog = MintLog(
            discount,
            settings.ticketSettings,
            sender,
            total,
            id,
            mintInfo.ticketOption
        );
        emit LMint(mintLog, "mintItem");
        return id;
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
        require(_tokenIds.current() < settings.maxMint, "sold out");
        uint256 total = totalPrice(mintInfos);

        //        require(msg.value >= total, "price too low");
        require(
            erc20.transferFrom(msg.sender, address(this), total),
            "transferFrom fail"
        );

        string memory ids = "";
        for (uint256 i = 0; i < mintInfos.length; i++) {
            require(
                keccak256(abi.encodePacked(mintInfos[i].specialStatus)) ==
                    keccak256(abi.encodePacked("")) ||
                    msg.sender == owner,
                "only owner"
            );
            uint256 mintedId = processMintIntem(mintInfos[i], msg.sender);

            emit LMintId(msg.sender, mintedId, "Minted Id");
        }
        return ids;
    }

    function cmpStr(string memory idopt, string memory opt)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((idopt))) ==
            keccak256(abi.encodePacked((opt))));
    }

    function generateSVGofTokenById(uint256 id)
        internal
        view
        returns (string memory)
    {
        string memory preEvent1;
        string memory preEvent3;
        if (cmpStr(_idToTicketOption[id], "workshops")) {
            preEvent1 = "Workshops";
        } else if (cmpStr(_idToTicketOption[id], "hotelWorkshops")) {
            preEvent3 = "Hotel";
        } else if (cmpStr(_idToTicketOption[id], "workshopsAndPreParty")) {
            preEvent1 = "Workshops && preparties";
        } else if (cmpStr(_idToTicketOption[id], "hotelWorkshopsAndPreParty")) {
            preEvent3 = "Hotel";
        }
        if (!cmpStr(_idToSpecialStatus[id], "")) {
            preEvent1 = _idToSpecialStatus[id];
        }

        string memory idstr = uint2str(id);
        string memory svg = string(
            abi.encodePacked(
                '<svg width="606" height="334" xmlns="http://www.w3.org/2000/svg"><rect style="fill:#fff;stroke:black;stroke-width:3;" width="602" height="331" x="1.5" y="1.5" ry="10" /><g transform="matrix(0.72064248,0,0,0.72064248,17.906491,14.009434)"><polygon fill="#',
                renderTokenById(id),
                '" points="0.0009,212.3208 127.9609,287.9578 127.9609,154.1588 " /></g><text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="143.01178" >Conference</text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="182.54297">',
                preEvent1,
                '</text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="222"></text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="266.28345">',
                preEvent3,
                '</text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="87">#',
                idstr,
                '</text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="315">@',
                _idToAttendeeInfo[id].telegram,
                '</text> <text style="font-size:40px;line-height:1.25;fill:#000000;" x="241" y="39">ETHDubai Ticket</text></svg>'
            )
        );

        return svg;
    }

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

    function compareStrings(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "not exist");
        string memory name = string(
            abi.encodePacked("ETHDubai Ticket #", id.toString())
        );
        string memory dsc = string(
            abi.encodePacked("Ticket to ETHDubai conference 2021.")
        );
        string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

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
                                dsc,
                                '", "external_url":"https://www.ethdubaiconf.org/token/',
                                id.toString(),
                                '", "attributes": [{"trait_type": "options", "value": "',
                                _idToTicketOption[id],
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

    function withdraw() public {
        uint256 amount = address(this).balance;

        (bool ok, ) = owner.call{value: amount}("");
        uint256 erc20Balance = erc20.balanceOf(address(this));

        require(erc20.transfer(owner, erc20Balance), "Failed");

        require(ok, "Failed");
        emit Lint(amount, "withdraw");
    }
}
