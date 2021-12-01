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
  let erc20;

  describe("ETHDubaiTicket", function () {
    it("Should deploy ETHDubaiTicket", async function () {
      const [owner] = await ethers.getSigners();
      const ETHDubaiTicket = await ethers.getContractFactory("ETHDubaiTicket");
      const Unlimited = await ethers.getContractFactory("Unlimited");

      myContract = await ETHDubaiTicket.deploy();
      erc20 = await Unlimited.deploy();
    });
  });

  describe("ticketSettings()", function () {
    it("Should be able to get ticket settings", async function () {
      let settings = await myContract.settings();
      //expect(await myContract.purpose()).to.equal(newPurpose);
      //        expect(true).to.equal(true);
      let ticketSettings = settings.ticketSettings;
      expect(ticketSettings.name).to.equal("early");
    });
  });

  describe("setTicketOption()", function () {
    it("Should be able to set a ticket Option", async function () {
      let name = "post conf safari";
      let amount = ethers.BigNumber.from("10").pow(16).mul(50);
      const [owner, nonOwner] = await ethers.getSigners();
      await myContract.setTicketOptions(8, amount);
    });
  });

  describe("getPrice() 3 days with hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = 3;
      const [owner, nonOwner] = await ethers.getSigners();
      let attendeeInfos = [
        {
          ticketCode: "_",
          ticketOption: 3,
          specialStatus: "",
        },
      ];
      const getTotal = async () => {
        return await myContract
          .connect(nonOwner)
          .getPriceView(nonOwner.address, ticketOption);
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.12").toString()
      );
    });
  });

  describe("getPrice() 3 days without Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = 0;

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract
          .connect(nonOwner)
          .getPriceView(nonOwner.address, ticketOption);
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.07").toString()
      );
    });
  });

  describe("getPrice() 1 day without Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = 6;

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPriceView(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.32").toString()
      );
    });
  });

  describe("getPrice() 1 day with Hotel", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = 1;
      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPriceView(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.17").toString()
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
        workshop: "omnivore",
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

            ticketOption: 3,
            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("0.12").toHexString() }
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
        workshop: "omnivore",
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

              ticketOption: 3,

              specialStatus: "",
            },
          ],
          { value: ethers.utils.parseEther("0.12").toHexString() }
        );
      };
      const setMaxMint = async () => {
        await myContract.setMaxMint(1);
      };
      expect(setMaxMint()).to.not.be.revertedWith("sold out");

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
        workshop: "omnivore",
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
        await myContract.setDiscount(nonOwner.address, [3], amount);
      };
      expect(setDiscount()).to.not.be.revertedWith("only owner");
    });
    it("Should not be able to set a discount from non owner", async function () {
      const [owner, nonOwner] = await ethers.getSigners();

      const nonOwnerSetDiscount = async () => {
        let amount = ethers.BigNumber.from("50");

        await myContract
          .connect(nonOwner)
          .setDiscount(nonOwner.address, [3], amount);
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
        workshop: "omnivore",
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

            ticketOption: 3,

            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("0.06").toHexString() }
      );
    });
  });

  describe("getPrice() with discount", function () {
    it("Should return price with with discount", async function () {
      let ticketOption = 3;

      const [owner, nonOwner] = await ethers.getSigners();
      const getTotal = async () => {
        return await myContract.connect(nonOwner).getPriceView(
          nonOwner.address,

          ticketOption
        );
      };
      const total = await getTotal();
      expect(total.toString()).to.equal(
        ethers.utils.parseEther("0.06").toString()
      );
    });
  });

  describe("mintItem() with option 3", function () {
    it("Should be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito+nonowner2@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        workshop: "omnivore",
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

            ticketOption: 3,

            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,

            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("0.24").toHexString() }
      );
    });
  });

  describe("mintItem() with 20 option 3", function () {
    it("Should be able to mint item", async function () {
      let attendeeInfo = {
        email: "patcito+nonowner2@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        workshop: "omnivore",
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

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
        ],
        { value: ethers.utils.parseEther("2.4").toHexString() }
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
        workshop: "omnivore",
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

              ticketOption: 3,

              specialStatus: "speaker",
            },
          ],
          { value: ethers.utils.parseEther(0.06).toHexString() }
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
        workshop: "omnivore",
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

              ticketOption: 3,

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
        workshop: "omnivore",
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

              ticketOption: 3,

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
        workshop: "omnivore",
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
      const zero = "0x0000000000000000000000000000000000000000";
      let attendeeInfo = {
        email: "patcito@gmail.com",
        fname: "Patrick",
        lname: "Aljord",
        twitter: "patcito",
        bio: "hello there",
        job: "dev",
        company: "yearn",
        workshop: "omnivore",
        tshirt: "M",
        telegram: "patcitotel",
      };
      let ticketCode = "xyz";
      let resellable = {
        isResellable: true,
        price: ethers.BigNumber.from("50"),
      };
      console.log("totalPrice");
      await myContract.connect(nonOwner4).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,

            ticketOption: 3,
            specialStatus: "",
          },
        ],

        { value: ethers.utils.parseEther("10.12").toHexString() }
      );
      const oldPricenop = await myContract.connect(nonOwner4).totalPrice([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: 3,
          specialStatus: "",
        },
      ]);
      console.log("setDao");

      const setDao = async () => {
        await myContract.setDao(erc20.address, 5, 90, 0, 0);
      };
      await erc20.approve(nonOwner4.address, 5000000000);
      await erc20.transfer(nonOwner4.address, 50);

      const newPricenopset = await myContract
        .connect(nonOwner4)
        .totalPrice([{ ticketCode: "_", ticketOption: 3, specialStatus: "" }]);
      await setDao([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: 3,
          specialStatus: "",
        },
      ]);
      const newPriceyespset = await myContract.connect(nonOwner4).totalPrice([
        {
          attendeeInfo,
          ticketCode,
          resellable,

          ticketOption: 3,
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

            ticketOption: 3,
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
