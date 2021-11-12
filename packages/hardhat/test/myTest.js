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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = false;
        let ticketOptions = ["hotelWorkshopsAndPreParty"];
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.4").toString()
        );
      });
    });

    describe("getPrice() 3 days without Hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
        let ticketOptions = ["workshopAndPreParty"];

        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions
            );
        };
        const total = await getTotal();
        expect(total.toString()).to.equal(
          ethers.utils.parseEther("0.2").toString()
        );
      });
    });

    describe("getPrice() 1 day without Hotel", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = false;
        let includeHotelExtra = false;
        let ticketOptions = ["conference"];

        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions
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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = false;
        let includeHotelExtra = true;
        let ticketOptions = ["hotelConference"];
        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions
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
      let includeWorkshops = false;
      let includeWorkshopsAndPreParty = true;
      let includeHotelExtra = true;
      const [owner, nonOwner] = await ethers.getSigners();
      const nonOwnerAddress = nonOwner.address;
      await myContract.connect(nonOwner).mintItem(
        [
          {
            attendeeInfo,
            ticketCode,
            resellable,
            includeWorkshops,
            includeWorkshopsAndPreParty,
            includeHotelExtra,
            ticketOptions: ["workshopAndPreParty"],
          },
        ],
        { value: ethers.utils.parseEther("3.8").toHexString() }
      );
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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
        const [owner, nonOwner] = await ethers.getSigners();
        const nonOwnerAddress = nonOwner.address;
        const mintAgain = async () => {
          await myContract.connect(nonOwner).mintItem(
            [
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
            ],
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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
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
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
            ],
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
          ["workshopAndPreParty"],
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
            .setDiscount(nonOwnerAddress, ["workshopAndPreParty"], amount);
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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
        const [owner, nonOwner] = await ethers.getSigners();
        const nonOwnerAddress = nonOwner.address;
        await myContract.connect(nonOwner).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions: ["workshopAndPreParty"],
            },
          ],
          { value: ethers.utils.parseEther("0.1").toHexString() }
        );
      });
    });

    describe("getPrice() with discount", function () {
      it("Should return price with with discount", async function () {
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = true;
        let includeHotelExtra = true;
        let ticketOptions = ["workshopAndPreParty"];

        const [owner, nonOwner] = await ethers.getSigners();
        const getTotal = async () => {
          return await myContract
            .connect(nonOwner)
            .getPrice(
              nonOwner.address,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,
              ticketOptions
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
        let includeWorkshops = false;
        let includeWorkshopsAndPreParty = false;
        let includeHotelExtra = false;
        const [owner, nonOwner, nonOwner2] = await ethers.getSigners();
        const nonOwnerAddress = nonOwner.address;
        await myContract.connect(nonOwner2).mintItem(
          [
            {
              attendeeInfo,
              ticketCode,
              resellable,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,

              ticketOptions: ["workshopAndPreParty"],
            },
            {
              attendeeInfo,
              ticketCode,
              resellable,
              includeWorkshops,
              includeWorkshopsAndPreParty,
              includeHotelExtra,

              ticketOptions: ["workshopAndPreParty"],
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
          expect(svg).to.equal(svg);
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
          expect(svg).to.equal(
            '<svg width="606" height="334" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(0.72064248,0,0,0.72064248,17.906491,14.009434)"><polygon fill="#4f15b1" points="255.9231,212.32 127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 " /><polygon fill="#5eedc1" points="0,212.32 127.962,287.959 127.962,154.158 127.962,0 " /><polygon fill="#bb604e" points="255.9991,236.5866 127.9611,312.1866 126.3861,314.1066 126.3861,412.3056 127.9611,416.9066 " /> <polygon fill="#5eedc1" points="127.962,416.9052 127.962,312.1852 0,236.5852 " /><polygon fill="#7265ef" points="127.9611,287.9577 255.9211,212.3207 127.9611,154.1587 " /><polygon fill="#920e2b" points="0.0009,212.3208 127.9609,287.9578 127.9609,154.1588 " /></g><text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="143.01178" >Conference</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="182.54297"></text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="222.82584"></text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="266.28345"></text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="87.164688">#1</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="315.82971">@patcitotel</text> <text style="font-style:normal;font-weight:normal;font-size:40px;line-height:1.25;font-family:sans-serif;fill:#000000;fill-opacity:1;stroke:none" x="241.91556" y="39.293556">ETHDubai Ticket</text><rect style="fill:none;stroke:#000000;stroke-width:3.0572;stroke-miterlimit:4;stroke-dasharray:none" id="rect2950" width="602.97424" height="331.64685" x="0" y="0" ry="10.078842" /></svg>'
          );
        });
      });
      describe("mintItem() with 6 conference only", function () {
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
          let includeWorkshops = false;
          let includeWorkshopsAndPreParty = false;
          let includeHotelExtra = false;
          const [owner, nonOwner, nonOwner2] = await ethers.getSigners();
          const nonOwnerAddress = nonOwner.address;
          await myContract.connect(nonOwner2).mintItem(
            [
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
              {
                attendeeInfo,
                ticketCode,
                resellable,
                includeWorkshops,
                includeWorkshopsAndPreParty,
                includeHotelExtra,
                ticketOptions: ["workshopAndPreParty"],
              },
            ],
            { value: ethers.utils.parseEther("4.0").toHexString() }
          );
        });
      });
    });
  });
});
