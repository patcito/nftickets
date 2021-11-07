const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

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

    describe("ticketSettings()", function () {
      it("Should be able to get ticket settings", async function () {
        let settings = await myContract.settings();
        //expect(await myContract.purpose()).to.equal(newPurpose);
        //        expect(true).to.equal(true);
        let ticketSettings = settings.ticketSettings;
        expect(ticketSettings.priceOneDay.toString()).to.equal(
          "100000000000000000"
        );
        expect(ticketSettings.priceTwoDays.toString()).to.equal(
          "2000000000000000000"
        );
        expect(ticketSettings.priceThreeDays.toString()).to.equal(
          "200000000000000000"
        );
        expect(ticketSettings.priceHotel.toString()).to.equal(
          "100000000000000000"
        );
      });
    });

    describe("getPrice() 3 days with hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = false;
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.2").toString()
        );
      });
    });

    describe("getPrice() 3 days without Hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.6").toString()
        );
      });
    });

    describe("getPrice() 1 day without Hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = false;
        let includeHotelExtra = false;
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.1").toString()
        );
      });
    });

    describe("getPrice() 1 with Hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = false;
        let includeHotelExtra = true;
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.3").toString()
        );
      });
    });

    describe("setTicketSettings()", function () {
      it("Should be able to set ticket settings", async function () {
        let name = "late bird";
        let pOneDay = ethers.BigNumber.from("10").pow(18);
        let pTwoDays = ethers.BigNumber.from("10").pow(18).mul(4);
        let pThreeDays = ethers.BigNumber.from("10").pow(18).mul(3);
        let pHotel = ethers.BigNumber.from("10").pow(17).mul(2);

        await myContract.setTicketSettings(
          name,
          pOneDay,
          pTwoDays,
          pThreeDays,
          pHotel
        );
        settings = await myContract.settings();
        const updatedTicketSettings = settings.ticketSettings;
        expect(updatedTicketSettings.priceOneDay.toString()).to.equal(
          ethers.utils.parseEther("1.0").toString()
        );
        expect(updatedTicketSettings.priceTwoDays.toString()).to.equal(
          ethers.utils.parseEther("4.0").toString()
        );
        expect(updatedTicketSettings.priceThreeDays.toString()).to.equal(
          ethers.utils.parseEther("3.0").toString()
        );
        expect(updatedTicketSettings.priceHotel.toString()).to.equal(
          ethers.utils.parseEther("0.2").toString()
        );
      });
    });

    describe("setTicketSettings() from non-owner", function () {
      it("Should not be able to set ticket settings from non-owner", async function () {
        let name = "late bird";
        let pOneDay = ethers.BigNumber.from("10").pow(18).mul(3);
        let pTwoDays = ethers.BigNumber.from("10").pow(18).mul(5);
        let pThreeDays = ethers.BigNumber.from("10").pow(18).mul(6);
        let pHotel = ethers.BigNumber.from("10").pow(17).mul(3);
        const [owner, nonOwner] = await ethers.getSigners();
        console.log(nonOwner.address);
        console.log(owner.address);
        const updateTicketSettingsFromNonOwner = async () => {
          await myContract
            .connect(nonOwner)
            .setTicketSettings(name, pOneDay, pTwoDays, pThreeDays, pHotel);
        };
        expect(updateTicketSettingsFromNonOwner()).to.be.revertedWith(
          "only owner can set ticket settings"
        );
        settings = await myContract.settings();
        const nonUpdatingSettings = settings.ticketSettings;

        expect(nonUpdatingSettings.priceOneDay.toString()).to.equal(
          ethers.utils.parseEther("1.0").toString()
        );
        expect(nonUpdatingSettings.priceTwoDays.toString()).to.equal(
          ethers.utils.parseEther("4.0").toString()
        );
        expect(nonUpdatingSettings.priceThreeDays.toString()).to.equal(
          ethers.utils.parseEther("3.0").toString()
        );
        expect(nonUpdatingSettings.priceHotel.toString()).to.equal(
          ethers.utils.parseEther("0.2").toString()
        );
      });

      describe("mintItem()", function () {
        it("Should be able to mint item", async function () {
          let attendeeInfo = {
            email: "patcito@gmail.com",
            name: "Patrick Aljord",
            twitter: "patcito",
            bio: "hello there",
            job: "dev",
            company: "yearn",
            diet: "omnivore",
            tshirt: "M",
          };
          let ticketCode = "xyz";
          let resellable = {
            isResellable: true,
            price: ethers.BigNumber.from("50"),
          };
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = true;
          let includeHotelExtra = true;
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          await myContract
            .connect(nonOwner)
            .mintItem(
              attendeeInfo,
              ticketCode,
              resellable,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              { value: ethers.utils.parseEther("3.8").toHexString() }
            );
        });
      });

      describe("mintItem() fail", function () {
        it("Should not be able to mint item", async function () {
          let attendeeInfo = {
            email: "patcito@gmail.com",
            name: "Patrick Aljord",
            twitter: "patcito",
            bio: "hello there",
            job: "dev",
            company: "yearn",
            diet: "omnivore",
            tshirt: "M",
          };
          let ticketCode = "xyz";
          let resellable = {
            isResellable: true,
            price: ethers.BigNumber.from("50"),
          };
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = true;
          let includeHotelExtra = true;
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          const mintAgain = async () => {
            await myContract
              .connect(nonOwner)
              .mintItem(
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                { value: ethers.utils.parseEther("3.8").toHexString() }
              );
          };
          expect(mintAgain()).to.be.revertedWith("sorry, we're sold out!");
        });
      });

      describe("mintItem() succeed", function () {
        it("Should be able to mint item again", async function () {
          let attendeeInfo = {
            email: "patcito@gmail.com",
            name: "Patrick Aljord",
            twitter: "patcito",
            bio: "hello there",
            job: "dev",
            company: "yearn",
            diet: "omnivore",
            tshirt: "M",
          };
          let ticketCode = "xyz";
          let resellable = {
            isResellable: true,
            price: ethers.BigNumber.from("50"),
          };
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = true;
          let includeHotelExtra = true;
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          await myContract.setMaxMint(100);
          const mintAgain = async () => {
            await myContract
              .connect(nonOwner)
              .mintItem(
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                { value: ethers.utils.parseEther("3.8").toHexString() }
              );
          };
        });
      });

      describe("setDiscount()", function () {
        it("Should be able to set a discount", async function () {
          let includeConf = true;
          let includeWorkshops = true;
          let includeWorkshopsAndPreParty = true;
          let amount = ethers.BigNumber.from("50");
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          await myContract.setDiscount(
            nonOwnerAddress,
            includeConf,
            includeWorkshops,
            includeWorkshopsAndPreParty,
            amount
          );
        });
      });

      describe("setDiscount() from non-owner", function () {
        it("Should not be able to set a discount from non-owner", async function () {
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          const nonOwnerSetDiscount = async () => {
            let includeConf = true;
            let includeWorkshops = true;
            let includeWorkshopsAndPreParty = true;
            let amount = ethers.BigNumber.from("50");

            await myContract
              .connect(nonOwner)
              .setDiscount(
                nonOwnerAddress,
                includeConf,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                amount
              );
          };
          expect(nonOwnerSetDiscount()).to.be.revertedWith(
            "only owner can add new discounts"
          );
        });
      });

      describe("mintItem() with discount", function () {
        it("Should be able to mint item", async function () {
          let attendeeInfo = {
            email: "patcito+nonowner@gmail.com",
            name: "Patrick Aljord",
            twitter: "patcito",
            bio: "hello there",
            job: "dev",
            company: "yearn",
            diet: "omnivore",
            tshirt: "M",
          };
          let ticketCode = "xyz";
          let resellable = {
            isResellable: true,
            price: ethers.BigNumber.from("50"),
          };
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = true;
          let includeHotelExtra = true;
          const [owner, nonOwner] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          await myContract
            .connect(nonOwner)
            .mintItem(
              attendeeInfo,
              ticketCode,
              resellable,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              { value: ethers.utils.parseEther("2.3").toHexString() }
            );
        });
      });

      describe("getPrice() with discount", function () {
        it("Should return price with with discount", async function () {
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = true;
          let includeHotelExtra = true;
          const [owner, nonOwner] = await ethers.getSigners();
          const getTotal = async () => {
            return await myContract
              .connect(nonOwner)
              .getPrice(
                nonOwner.address,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra
              );
          };
          const total = await getTotal();
          expect(total.toString()).to.equal(
            ethers.utils.parseEther("2.3").toString()
          );
        });
      });

      describe("generateSVGofTokenById(uint256 id)", function () {
        it("Should return price with with discount", async function () {
          const generateSVG = async () => {
            return await myContract.generateSVGofTokenById();
          };
          const svg = await generateSVG();
          console.log(svg);
          expect(svg).to.equal(svg);
        });
      });
    });
  });
});
