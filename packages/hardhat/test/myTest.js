const { ethers } = require("hardhat");
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const fs = require("fs");

use(solidity);
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
describe("My Dapp", function () {
  let myContract;

  describe("ETHDubaiTicket", function () {
    it("Should deploy ETHDubaiTicket", async function () {
      const [owner] = await ethers.getSigners();
      const ETHDubaiTicket = await ethers.getContractFactory("ETHDubaiTicket");

      myContract = await ETHDubaiTicket.deploy();
    });
  });

  describe("ticketSettings()", function () {
    it("Should be able to get ticket settings", async function () {
      let settings = await myContract.settings();
      //expect(await myContract.purpose()).to.equal(newPurpose);
      //        expect(true).to.equal(true);
      let ticketSettings = settings.ticketSettings;
      expect(ticketSettings.name).to.equal("early bird");
    });
  });

  describe("setTicketOption()", function () {
    it("Should be able to set a ticket Option", async function () {
      let name = "post conf safari";
      let amount = ethers.BigNumber.from("10").pow(16).mul(50);
      const [owner, nonOwner] = await ethers.getSigners();
      await myContract.setTicketOption(name, amount);
    });
  });

  describe("getPrice() 3 days with hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = "hotelWorkshopsAndPreParty";
      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract
          .connect(nonOwner)
          .getPrice(nonOwner.address, ticketOption);
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.4").toString()
      );
    });
  });

  describe("getPrice() 3 days without Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = "workshopAndPreParty";

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract
          .connect(nonOwner)
          .getPrice(nonOwner.address, ticketOption);
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.2").toString()
      );
    });
  });

  describe("getPrice() 1 day without Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = "conference";

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPrice(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.1").toString()
      );
    });
  });

  describe("getPrice() 1 day with Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = "hotelConference";
      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPrice(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.2").toString()
      );
    });
  });

  describe("setTicketSettings()", function () {
    it("Should be able to set ticket settings", async function () {
      let name = "late bird";

      await myContract.setTicketSettings(name);
      settings = await myContract.settings();
      const updatedTicketSettings = settings.ticketSettings;
      expect(updatedTicketSettings.name).to.equal("late bird");
    });
  });

  describe("setTicketSettings() from non-owner", function () {
    it("Should not be able to set ticket settings from non-owner", async function () {
      let name = "super late bird";

      const [owner, nonOwner] = await ethers.getSigners();
      console.log(nonOwner.address);
      console.log(owner.address);
      const updateTicketSettingsFromNonOwner = async () => {
        await myContract.connect(nonOwner).setTicketSettings(name);
      };
      expect(updateTicketSettingsFromNonOwner()).to.be.revertedWith(
        "only owner"
      );
      settings = await myContract.settings();
      const nonUpdatingSettings = settings.ticketSettings;

      expect(nonUpdatingSettings.name).to.equal("late bird");
    });
  });

  describe("mintItem()", function () {
    it("Should be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      await myContract.connect(nonOwner).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("3.8").toHexString() }
      );
    });
  });

  describe("mintItem() fail", function () {
    it("Should not be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      const mintAgain = async () => {
        await myContract.connect(nonOwner).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "",
            },
          ],
          { value: ethers.utils.parseEther("3.8").toHexString() }
        );
      };
      expect(mintAgain()).to.be.revertedWith("sold out");
    });
  });

  describe("mintItem() succeed", function () {
    it("Should be able to mint item again1", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      const setMaxMint = async () => {
        await myContract.setMaxMint(100);
      };
      const mintAgain = async () => {
        await myContract.connect(nonOwner).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "",
            },
          ],
          { value: ethers.utils.parseEther("3.8").toHexString() }
        );
      };

      expect(setMaxMint()).to.not.be.revertedWith("sold out");

      expect(mintAgain()).to.not.be.revertedWith("sold out");
    });
  });

  describe("setDiscount()", function () {
    it("Should be able to set a discount", async function () {
      let amount = ethers.BigNumber.from("50");

      const [owner, nonOwner] = await ethers.getSigners();
      const setDiscount = async () => {
        await myContract.setDiscount(
          nonOwner.address,
          ["workshopAndPreParty"],
          amount
        );
      };
      expect(setDiscount()).to.not.be.revertedWith("only owner");
    });
    it("Should be able to set a discount from non owner", async function () {
      const [owner, nonOwner] = await ethers.getSigners();

      const nonOwnerSetDiscount = async () => {
        let amount = ethers.BigNumber.from("50");

        await myContract
          .connect(nonOwner)
          .setDiscount(nonOwner.address, ["workshopAndPreParty"], amount);
      };
      expect(nonOwnerSetDiscount()).to.be.revertedWith("only owner");
    });
    it("Should be able to buy a ticket with discount", async function () {
      const [owner, nonOwner] = await ethers.getSigners();

      let attendeeInfo = {
        email: "patcito+nonowner@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      await myContract.connect(nonOwner).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",

            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("0.1").toHexString() }
      );
    });
  });

  describe("getPrice() with discount", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = "workshopAndPreParty";

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPrice(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.1").toString()
      );
    });
  });

  describe("mintItem() with conference only", function () {
    it("Should be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito+nonowner2@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner, nonOwner2] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      await myContract.connect(nonOwner2).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",

            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",

            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("2.0").toHexString() }
      );
    });

    describe("generateSVGofTokenById(uint256 id)", function () {
      it("Should return svg of ticket id", async function () {
        const generateSVG = async () => {
          return await myContract.tokenURI(1);
        };
        const data = await generateSVG();
        console.log(data);
        //console.log(atob(data));
        const json = Buffer.from(data.substring(29), "base64").toString();
        console.log(json);
        const obj = JSON.parse(json);
        console.log(obj);
        const svg = Buffer.from(obj.image.substring(26), "base64").toString();
        fs.writeFileSync("/tmp/svg.svg", svg);

        expect(svg).to.equal(svg);
      });
    });
  });

  describe("generateSVGofTokenById(uint256 id) conference only badge", function () {
    it("Should return svg of ticket id", async function () {
      const generateSVG = async () => {
        return await myContract.tokenURI(3);
      };
      const data = await generateSVG();
      console.log(data);
      //console.log(atob(data));
      const json = Buffer.from(data.substring(29), "base64").toString();
      console.log(json);
      const obj = JSON.parse(json);
      console.log(obj);
      const svg = Buffer.from(obj.image.substring(26), "base64").toString();
      console.log("working", svg);
      fs.writeFileSync("/tmp/svg2.svg", svg);

      expect(svg).to.equal(svg);
    });
  });

  describe("mintItem() with 20 conference only", function () {
    it("Should be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito+nonowner2@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner, nonOwner2] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      await myContract.connect(nonOwner2).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("4.0").toHexString() }
      );
    });
  });

  describe("mintItem() succeed with special status", function () {
    it("Should be able to mint item again2", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      await myContract.setMaxMint(100);
      const mintAgain = async () => {
        await myContract.connect(nonOwner).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "speaker",
            },
          ],
          { value: ethers.utils.parseEther("3.8").toHexString() }
        );
      };
    });
  });

  describe("mintItem() fail when non-owner set special status", function () {
    it("Should not be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      const mintAgain = async () => {
        await myContract.connect(nonOwner).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "Speaker",
            },
          ],
          { value: ethers.utils.parseEther("3.8").toHexString() }
        );
      };
      expect(mintAgain()).to.be.revertedWith("only owner");
    });
  });

  describe("withdraw() successfully", function () {
    it("Should be able to withdraw from contract to owner account", async function () {
      const [owner] = await ethers.getSigners();

      let currentBalance = await myContract.provider.getBalance(
        myContract.address
      );
      let ownerBalance = await myContract.provider.getBalance(owner.address);
      await myContract.withdraw();

      let newBalance = await myContract.provider.getBalance(myContract.address);
      let newOwnerBalance = await myContract.provider.getBalance(owner.address);

      expect(currentBalance.toString()).to.not.equal("0");
      expect(currentBalance.toString()).to.not.equal(newBalance.toString());
      expect(newBalance.toString()).to.equal("0");
      expect(ownerBalance.toString()).to.not.equal(newOwnerBalance.toString());

      console.log("balance,", currentBalance.toString());
      console.log("new balance,", newBalance.toString());
      console.log("owner balance,", ownerBalance.toString());
      console.log("owner new balance,", newOwnerBalance.toString());
      //expect(await myContract.purpose()).to.equal(newPurpose);
      //        expect(true).to.equal(true);
      //expect(ticketSettings.name).to.equal("early bird");
    });
  });

  describe("mintItem() succeed with special status", function () {
    it("Should be able to mint item again3", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner] = await ethers.getSigners();
      const mintAgain = async () => {
        await myContract.mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "speaker",
            },
          ],
          { value: ethers.utils.parseEther("3.8").toHexString() }
        );
      };
      expect(mintAgain()).to.not.be.revertedWith("only owner");
    });
  });

  describe("withdraw() successfully called by non-owner", function () {
    it("Should be able to withdraw from contract to owner account", async function () {
      const [owner, nonOwner] = await ethers.getSigners();

      let currentBalance = await myContract.provider.getBalance(
        myContract.address
      );
      let ownerBalance = await myContract.provider.getBalance(owner.address);
      let nonOwnerBalance = await myContract.provider.getBalance(
        nonOwner.address
      );
      await myContract.connect(nonOwner).withdraw();

      let newBalance = await myContract.provider.getBalance(myContract.address);
      let newOwnerBalance = await myContract.provider.getBalance(owner.address);
      let newNonOwnerBalance = await myContract.provider.getBalance(
        nonOwner.address
      );

      console.log("balance,", currentBalance.toString());
      console.log("new balance,", newBalance.toString());
      console.log("owner balance,", ownerBalance.toString());
      console.log("owner new balance,", newOwnerBalance.toString());
      console.log("non owner balance,", nonOwnerBalance.toString());
      console.log("non owner new balance,", newNonOwnerBalance.toString());

      expect(currentBalance.toString()).to.not.equal("0");
      expect(currentBalance.toString()).to.not.equal(newBalance.toString());
      expect(newBalance.toString()).to.equal("0");
      expect(ownerBalance.toString()).to.not.equal(newOwnerBalance.toString());
      expect(nonOwnerBalance.toString()).to.not.equal(
        newNonOwnerBalance.toString()
      );
    });
  });

  describe("mintItem() succeed with special status", function () {
    it("Should be able to mint item again4", async function () {
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const [owner] = await ethers.getSigners();
      const mintAgain = async () => {
        await myContract.mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,

              ticketOption: "workshopAndPreParty",

              specialStatus: "speaker",
            },
          ],
          { value: ethers.utils.parseEther("10").toHexString() }
        );
      };
      expect(mintAgain()).to.not.be.revertedWith("only owner");
    });
  });

  describe("setResellable() and resell() successfully called", function () {
    it("Should not be able to setResellable", async function () {
      const [owner, nonOwnerSeller, nonOwnerBuyer] = await ethers.getSigners();
      console.log("nonOwnerSellerAddress", nonOwnerSeller.address);
      const oo = await myContract.ownerOf(1);
      console.log("owner of 1", oo);

      const setResellable = async (o) => {
        await myContract
          .connect(o)
          .setResellable(1, true, ethers.utils.parseEther("4").toHexString());
      };
      expect(setResellable(nonOwnerBuyer)).to.be.revertedWith("only owner");
    });
    it("Should  be able to setResellable", async function () {
      const [owner, nonOwnerSeller, nonOwnerBuyer] = await ethers.getSigners();
      console.log("nonOwnerSellerAddress", nonOwnerSeller.address);
      const oo = await myContract.ownerOf(1);
      console.log("owner of 1", oo);

      const setResellable = async (o) => {
        await myContract
          .connect(o)
          .setResellable(1, true, ethers.utils.parseEther("4").toHexString());
      };

      expect(setResellable(nonOwnerSeller)).to.not.be.revertedWith(
        "only ticket owner can reset resell status"
      );
    });
    it("Should not be able to resell()", async function () {
      const [owner, nonOwnerSeller, nonOwnerBuyer] = await ethers.getSigners();
      console.log("nonOwnerSellerAddress", nonOwnerSeller.address);
      const oo = await myContract.ownerOf(1);
      console.log("owner of 1", oo);

      const resell = async (amount) =>
        myContract.connect(nonOwnerBuyer).resell(
          1,

          { value: ethers.utils.parseEther(amount).toHexString() }
        );
      expect(resell("3.1")).to.be.revertedWith("price too low");
    });

    it("Should be able to resell()", async function () {
      const [owner, nonOwnerSeller, nonOwnerBuyer] = await ethers.getSigners();
      console.log("nonOwnerSellerAddress", nonOwnerSeller.address);
      const oo = await myContract.ownerOf(1);
      console.log("owner of 1", oo);

      const resell = async (amount) =>
        myContract.connect(nonOwnerBuyer).resell(
          1,

          { value: ethers.utils.parseEther(amount).toHexString() }
        );
      let ownerBalance = await myContract.provider.getBalance(owner.address);
      let nonOwnerSellerBalance = await myContract.provider.getBalance(
        nonOwnerSeller.address
      );
      let nonOwnerBuyerBalance = await myContract.provider.getBalance(
        nonOwnerBuyer.address
      );
      let donateBalance = await myContract.provider.getBalance(
        "0x579E8e014F5B2c6D7a3373fb840F8DaFeacBfae1"
      );
      let cb = await myContract.provider.getBalance(myContract.address);
      expect(resell("4.0")).to.not.be.revertedWith("price too low");
      let newcb = await myContract.provider.getBalance(myContract.address);
      let newOwnerBalance = await myContract.provider.getBalance(owner.address);
      let newNonOwnerSellerBalance = await myContract.provider.getBalance(
        nonOwnerSeller.address
      );
      let newNonOwnerBuyerBalance = await myContract.provider.getBalance(
        nonOwnerBuyer.address
      );
      let newDonateBalance = await myContract.provider.getBalance(
        "0x579E8e014F5B2c6D7a3373fb840F8DaFeacBfae1"
      );

      console.log("owner balance,", ownerBalance.toString());
      console.log("owner new balance,", newOwnerBalance.toString());
      console.log("\n");
      console.log(nonOwnerSellerBalance.toString(), "nonOwner Seller balance,");
      console.log(
        newNonOwnerSellerBalance.toString(),
        "nonOwnerSeller new balance,"
      );
      console.log("\n");
      console.log(nonOwnerBuyerBalance.toString(), "nonOwner Buyer balance,");
      console.log(newNonOwnerBuyerBalance.toString(), "nonOwnerBuyer balance,");
      console.log("\n");

      console.log(donateBalance.toString(), "donate balance,");
      console.log(newDonateBalance.toString(), "donate new balance,");
      console.log("\n");
      assert.isBelow(
        newNonOwnerBuyerBalance.div(1000000000).toNumber(),
        nonOwnerBuyerBalance.div(1000000000).toNumber(),
        "buyer has less eth"
      );
      assert.isBelow(
        newNonOwnerBuyerBalance.div(1000000000).toNumber(),
        nonOwnerBuyerBalance.div(1000000000).toNumber(),
        "seller has more eth"
      );

      console.log("cb", cb.toString());
      console.log("newcb", newcb.toString());
    });

    it("Should update token owner", async function () {
      const [owner, nonOwnerSeller, nonOwnerBuyer] = await ethers.getSigners();

      const newOwner = await myContract.ownerOf(1);
      expect(newOwner).to.equal(nonOwnerBuyer.address);
      //   console.log("owner balance,", ownerBalance.toString());
      // console.log("nonOwner Seller balance,", nonOwnerSellerBalance.toString());
      // console.log("nonOwner Buyer balance,", nonOwnerBuyerBalance.toString());
      //console.log("donate balance,", donateBalance.toString());
    });
  });
  /*
      let ownerBalance = await myContract.provider.getBalance(owner.address);
      let nonOwnerBalance = await myContract.provider.getBalance(
        nonOwner.address
      );
      await myContract.connect(nonOwner).withdraw();

      let newBalance = await myContract.provider.getBalance(myContract.address);
      let newOwnerBalance = await myContract.provider.getBalance(owner.address);
      let newNonOwnerBalance = await myContract.provider.getBalance(
        nonOwner.address
      );

      console.log("balance,", currentBalance.toString());
      console.log("new balance,", newBalance.toString());
      console.log("owner balance,", ownerBalance.toString());
      console.log("owner new balance,", newOwnerBalance.toString());
      console.log("non owner balance,", nonOwnerBalance.toString());
      console.log("non owner new balance,", newNonOwnerBalance.toString());

      expect(currentBalance.toString()).to.not.equal("0");
      expect(currentBalance.toString()).to.not.equal(newBalance.toString());
      expect(newBalance.toString()).to.equal("0");
      expect(ownerBalance.toString()).to.not.equal(newOwnerBalance.toString());
      expect(nonOwnerBalance.toString()).to.not.equal(
        newNonOwnerBalance.toString()
      );
      expect(newOwnerBalance.toString()).to.equal("10009888474257379902846");
      expect(newNonOwnerBalance.toString()).to.equal("9996098458802720088457");
      */
  describe("setDaos() and modify totalPrice() successfully", function () {
    it("Should set DAOs", async function () {
      const [owner, nonOwner, nonOwner3, nonOwner4] = await ethers.getSigners();
      console.log(nonOwner4);
      const zero = "0x0000000000000000000000000000000000000000";
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        diet: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };

      const oldPricenop = await myContract.connect(nonOwner4).totalPrice([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: "workshopAndPreParty",
          specialStatus: "",
        },
      ]);
      const setDaos = async () => {
        await myContract.setDaos(myContract.address, zero, zero, 5);
      };
      await setDaos();
      const newPricenopset = await myContract.connect(nonOwner4).totalPrice([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: "workshopAndPreParty",
          specialStatus: "",
        },
      ]);
      await myContract.connect(nonOwner4).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("0.2").toHexString() }
      );

      const newPriceyespset = await myContract.connect(nonOwner4).totalPrice([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: "workshopAndPreParty",
          specialStatus: "",
        },
      ]);

      console.log(oldPricenop.toString(), "oldPricenop");
      console.log(newPricenopset.toString(), "oldPricenopset");
      console.log(newPriceyespset.toString(), "newPriceyespset");

      await myContract.connect(nonOwner4).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: "workshopAndPreParty",
            specialStatus: "",
          },
        ],
        { value: newPriceyespset.toHexString() }
      );

      expect(oldPricenop).to.equal(newPricenopset);
      assert.isBelow(
        newPriceyespset.toString(),
        oldPricenop,
        "new price is cheaper"
      );
    });
  });
});
