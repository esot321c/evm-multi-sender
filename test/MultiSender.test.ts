import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("MultiSender", function () {
  let multiSender: Contract;
  let token: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MultiSender = await ethers.getContractFactory("MultiSender");
    multiSender = await MultiSender.deploy();

    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Mock Token", "MTK");
  });

  it("Should multi-send ERC20 tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await token.mint(await owner.getAddress(), mintAmount);
    await token.approve(await multiSender.getAddress(), mintAmount);

    const recipients = [await addr1.getAddress(), await addr2.getAddress()];
    const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

    await multiSender.multiSendToken(await token.getAddress(), recipients, amounts);

    expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(await addr2.getAddress())).to.equal(ethers.parseEther("200"));
  });

  it("Should multi-send ETH", async function () {
    const recipients = [await addr1.getAddress(), await addr2.getAddress()];
    const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];

    const initialBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
    const initialBalance2 = await ethers.provider.getBalance(await addr2.getAddress());

    await multiSender.multiSendEth(recipients, amounts, { value: ethers.parseEther("3") });

    const finalBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
    const finalBalance2 = await ethers.provider.getBalance(await addr2.getAddress());

    expect(finalBalance1 - initialBalance1).to.equal(ethers.parseEther("1"));
    expect(finalBalance2 - initialBalance2).to.equal(ethers.parseEther("2"));
  });
});