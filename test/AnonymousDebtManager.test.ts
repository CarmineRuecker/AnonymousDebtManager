import { expect } from "chai"
import { ethers } from "hardhat"
import { AnonymousDebtManager } from "../types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("AnonymousDebtManager", function () {
  let debtManager: AnonymousDebtManager
  let owner: SignerWithAddress
  let debtor: SignerWithAddress
  let creditor: SignerWithAddress

  beforeEach(async function () {
    // Get signers
    [owner, debtor, creditor] = await ethers.getSigners()

    // Deploy the contract
    const AnonymousDebtManagerFactory = await ethers.getContractFactory("AnonymousDebtManager")
    debtManager = await AnonymousDebtManagerFactory.deploy()
    await debtManager.waitForDeployment()
  })

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await debtManager.owner()).to.equal(owner.address)
    })

    it("Should initialize with correct starting values", async function () {
      expect(await debtManager.nextDebtId()).to.equal(1)
      expect(await debtManager.nextProposalId()).to.equal(1)
    })

    it("Should authorize owner as creditor by default", async function () {
      expect(await debtManager.authorizedCreditors(owner.address)).to.be.true
    })
  })

  describe("Creditor Authorization", function () {
    it("Should allow owner to authorize creditors", async function () {
      await debtManager.connect(owner).setAuthorizedCreditor(creditor.address, true)
      expect(await debtManager.authorizedCreditors(creditor.address)).to.be.true
    })

    it("Should allow owner to revoke creditor authorization", async function () {
      await debtManager.connect(owner).setAuthorizedCreditor(creditor.address, true)
      await debtManager.connect(owner).setAuthorizedCreditor(creditor.address, false)
      expect(await debtManager.authorizedCreditors(creditor.address)).to.be.false
    })

    it("Should revert if non-owner tries to authorize creditors", async function () {
      await expect(
        debtManager.connect(debtor).setAuthorizedCreditor(creditor.address, true)
      ).to.be.revertedWith("AnonymousDebtManager: Only owner can perform this action")
    })
  })

  describe("Debt Creation", function () {
    it("Should create a debt with valid parameters", async function () {
      // Note: In a real FHE test, we would use proper encrypted inputs
      // For this test, we'll use placeholder bytes
      const encryptedAmount = "0x1234567890abcdef"
      const encryptedRate = "0xabcdef1234567890"
      const termDays = 365
      const isAnonymous = false

      await expect(
        debtManager.connect(debtor).createDebt(encryptedAmount, encryptedRate, termDays, isAnonymous)
      ).to.emit(debtManager, "DebtCreated")

      expect(await debtManager.nextDebtId()).to.equal(2)
      
      const userDebts = await debtManager.getUserDebts(debtor.address)
      expect(userDebts.length).to.equal(1)
      expect(userDebts[0]).to.equal(1)
    })

    it("Should revert with invalid term (0 days)", async function () {
      const encryptedAmount = "0x1234567890abcdef"
      const encryptedRate = "0xabcdef1234567890"
      
      await expect(
        debtManager.connect(debtor).createDebt(encryptedAmount, encryptedRate, 0, false)
      ).to.be.revertedWith("AnonymousDebtManager: Term must be greater than 0 days")
    })

    it("Should revert with invalid term (too long)", async function () {
      const encryptedAmount = "0x1234567890abcdef"
      const encryptedRate = "0xabcdef1234567890"
      
      await expect(
        debtManager.connect(debtor).createDebt(encryptedAmount, encryptedRate, 36501, false)
      ).to.be.revertedWith("AnonymousDebtManager: Term cannot exceed 100 years")
    })
  })

  describe("Debt Information", function () {
    beforeEach(async function () {
      // Create a test debt
      const encryptedAmount = "0x1234567890abcdef"
      const encryptedRate = "0xabcdef1234567890"
      await debtManager.connect(debtor).createDebt(encryptedAmount, encryptedRate, 365, false)
    })

    it("Should return debt info for valid debt ID", async function () {
      const debtInfo = await debtManager.getDebtInfo(1)
      
      expect(debtInfo[0]).to.equal(debtor.address) // debtor
      expect(debtInfo[1]).to.equal(365) // originalTerm
      expect(debtInfo[2]).to.equal(365) // remainingTerm
      expect(debtInfo[4]).to.equal(0) // status (ACTIVE)
      expect(debtInfo[5]).to.be.false // isAnonymous
    })

    it("Should return zero address for anonymous debt", async function () {
      // Create anonymous debt
      const encryptedAmount = "0x1234567890abcdef"
      const encryptedRate = "0xabcdef1234567890"
      await debtManager.connect(debtor).createDebt(encryptedAmount, encryptedRate, 365, true)

      const debtInfo = await debtManager.getDebtInfo(2)
      expect(debtInfo[0]).to.equal(ethers.ZeroAddress) // debtor should be zero for anonymous
      expect(debtInfo[5]).to.be.true // isAnonymous
    })
  })

  describe("Emergency Functions", function () {
    it("Should allow owner to call emergencyPause", async function () {
      await expect(
        debtManager.connect(owner).emergencyPause()
      ).to.be.revertedWith("AnonymousDebtManager: Contract paused by owner")
    })

    it("Should revert if non-owner calls emergencyPause", async function () {
      await expect(
        debtManager.connect(debtor).emergencyPause()
      ).to.be.revertedWith("AnonymousDebtManager: Only owner can perform this action")
    })
  })
})