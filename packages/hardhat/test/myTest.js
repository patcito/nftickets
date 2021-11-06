const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const fs = require("fs");

use(solidity);

describe("My Dapp", function () {
  let myContract;

  describe("ETHDubaiTicket", function () {
    it("Should deploy ETHDubaiTicket", async function () {
      const [owner] = await ethers.getSigners();
      const ETHDubaiTicket = await ethers.getContractFactory("ETHDubaiTicket");

      let uploadedAssets = JSON.parse(fs.readFileSync("./uploaded.json"));
      let bytes32Array = [];
      for (let a in uploadedAssets) {
        console.log(" 🏷 IPFS:", a);
        let bytes32 = ethers.utils.id(a);
        console.log(" #️⃣ hashed:", bytes32);
        bytes32Array.push(bytes32);
      }
      console.log(" \n");
      myContract = await ETHDubaiTicket.deploy(bytes32Array);
    });
    /*
    describe("setPurpose()", function () {
      it("Should be able to set a new purpose", async function () {
        //const newPurpose = "Test Purpose";

        //        await myContract.setPurpose(newPurpose);
        //expect(await myContract.purpose()).to.equal(newPurpose);
        expect(true).to.equal(true);
      });
    });
*/
    describe("ticketSettings()", function () {
      it("Should be able to get ticket settings", async function () {
        const ticketSettings = await myContract.ticketSettings();
        //expect(await myContract.purpose()).to.equal(newPurpose);
        //        expect(true).to.equal(true);

        expect(ticketSettings.priceOneDay.toString()).to.equal(
          "100000000000000000"
        );
        expect(ticketSettings.priceTwoDays.toString()).to.equal(
          "2000000000000000000"
        );
        expect(ticketSettings.priceThreeDays.toString()).to.equal(
          "200000000000000000"
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
        const updatedTicketSettings = await myContract.ticketSettings();
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
        const nonUpdatingSettings = await myContract.ticketSettings();
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
          let uploadedAssets = JSON.parse(fs.readFileSync("./uploaded.json"));
          let tokenURI = Object.keys(uploadedAssets)[0];
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
              tokenURI,
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
          let uploadedAssets = JSON.parse(fs.readFileSync("./uploaded.json"));
          let tokenURI = Object.keys(uploadedAssets)[1];
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
              tokenURI,
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
    });
  });
});
