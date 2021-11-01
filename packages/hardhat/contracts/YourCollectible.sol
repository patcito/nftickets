pragma experimental ABIEncoderV2;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//import "@openzeppelin/contracts/access/Ownable.sol";
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract YourCollectible is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address payable public owner;
    uint256 public conferencePrice;
    uint256 public workshopConferencePrice;

    //uint256 public price;

    constructor(bytes32[] memory assetsForSale)
        public
        ERC721("YourCollectible", "YCB")
    {
        owner = payable(msg.sender);
        conferencePrice = 10**17;
        workshopConferencePrice = 2 * 10**17;
        _setBaseURI("https://ipfs.io/ipfs/");
        //for (uint256 i = 0; i < assetsForSale.length; i++) {
        for (uint256 i = 0; i < 4; i++) {
            forSale[assetsForSale[i]] = true;
        }
    }

    struct Resellable {
        bool isResellable;
        uint256 price;
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

    function markAsScanned(uint256 id, bool scanned) public returns (bool) {
        require(msg.sender == owner, "only owner can mark as scanned");
        _idToScanned[id] = scanned;
        return scanned;
    }

    function cancelTicket(uint256 id, bool canceled) public returns (bool) {
        require(msg.sender == owner, "only owner can cancel ticket");
        _idToCanceled[id] = canceled;
        return canceled;
    }

    function setPrice(uint256 confPrice, uint256 wsConfPrice)
        public
        returns (bool)
    {
        require(msg.sender == owner, "only owner can cancel ticket");
        conferencePrice = confPrice;
        workshopConferencePrice = wsConfPrice;
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
        address payable coordinape = 0x579E8e014F5B2c6D7a3373fb840F8DaFeacBfae1;

        coordinape.transfer(coordinapeAmount);
        from.transfer(resellerAmount);
        _transfer(from, to, tokenId);
    }

    function _setForSale(string memory tokenURI, bool newForSale) public {
        require(msg.sender == owner, "only owner can cancel ticket");
        bytes32 uriHash = keccak256(abi.encodePacked(tokenURI));
        forSale[uriHash] = newForSale;
    }

    function mintItem(
        string memory tokenURI,
        AttendeeInfo memory attendeeInfo,
        string memory ticketCode,
        Resellable memory resellable,
        bool includeWorkshops
    ) public payable returns (uint256) {
        console.log("mm %s", msg.value);
        console.log("email %s", attendeeInfo.email);
        require(
            msg.value >= conferencePrice,
            "Not enough ETH sent; check price!"
        );
        if (includeWorkshops) {
            require(
                msg.value >= workshopConferencePrice,
                "Not enough ETH sent; check price!"
            );
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
    }
}
