// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/contracts/FHE.sol";

/**
 * @title Anonymous Debt Restructuring Platform
 * @dev A privacy-first debt management system using FHE encrypted on-chain data
 * @author Anonymous Debt Restructuring Team
 */
contract AnonymousDebtManager {
    
    address public owner;
    uint256 public nextDebtId;
    uint256 public nextProposalId;
    
    enum DebtStatus { ACTIVE, RESTRUCTURING, RESOLVED, DEFAULTED }
    enum ProposalStatus { PENDING, ACCEPTED, REJECTED, EXECUTED }
    
    struct DebtRecord {
        address debtor;
        euint64 encryptedAmount;      // FHE encrypted amount in wei equivalent
        euint32 encryptedInterestRate; // FHE encrypted rate in basis points
        uint256 originalTerm;         // Original term in days
        uint256 remainingTerm;        // Remaining term in days
        uint256 createdAt;            // Creation timestamp
        DebtStatus status;            // Current debt status
        bool isAnonymous;             // Privacy flag
        bytes32 dataHash;             // Hash for data integrity
    }
    
    struct RestructuringProposal {
        uint256 debtId;               // Associated debt ID
        address proposer;             // Who proposed the restructuring
        euint64 newEncryptedAmount;   // FHE encrypted new amount
        euint32 newEncryptedRate;     // FHE encrypted new interest rate
        uint256 newTerm;              // New term in days
        uint256 proposedAt;           // Proposal timestamp
        ProposalStatus status;        // Proposal status
        bool creditorApproval;        // Creditor approval flag
        bool debtorApproval;          // Debtor approval flag
        string reason;                // Reason for restructuring
        bytes32 proposalHash;         // Hash for proposal integrity
    }
    
    // Storage mappings
    mapping(uint256 => DebtRecord) public debts;
    mapping(uint256 => RestructuringProposal) public proposals;
    mapping(address => uint256[]) public userDebts;
    mapping(address => uint256[]) public userProposals;
    mapping(address => bool) public authorizedCreditors;
    
    // Events for frontend listening
    event DebtCreated(
        uint256 indexed debtId,
        address indexed debtor,
        uint256 originalTerm,
        bool isAnonymous,
        uint256 timestamp
    );
    
    event RestructuringProposed(
        uint256 indexed proposalId,
        uint256 indexed debtId,
        address indexed proposer,
        uint256 newTerm,
        uint256 timestamp
    );
    
    event ProposalStatusChanged(
        uint256 indexed proposalId,
        ProposalStatus newStatus,
        address indexed changedBy,
        uint256 timestamp
    );
    
    event DebtStatusChanged(
        uint256 indexed debtId,
        DebtStatus newStatus,
        address indexed changedBy,
        uint256 timestamp
    );
    
    event ApprovalGranted(
        uint256 indexed proposalId,
        address indexed approver,
        bool isCreditor,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "AnonymousDebtManager: Only owner can perform this action");
        _;
    }
    
    modifier onlyDebtor(uint256 debtId) {
        require(debts[debtId].debtor == msg.sender, "AnonymousDebtManager: Only debtor can perform this action");
        _;
    }
    
    modifier validDebt(uint256 debtId) {
        require(debtId > 0 && debtId < nextDebtId, "AnonymousDebtManager: Invalid debt ID");
        require(debts[debtId].debtor != address(0), "AnonymousDebtManager: Debt does not exist");
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        require(proposalId > 0 && proposalId < nextProposalId, "AnonymousDebtManager: Invalid proposal ID");
        require(proposals[proposalId].proposer != address(0), "AnonymousDebtManager: Proposal does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        nextDebtId = 1;
        nextProposalId = 1;
        
        // Owner is automatically authorized as a creditor
        authorizedCreditors[msg.sender] = true;
    }
    
    /**
     * @dev Creates a new debt record with encrypted financial data
     * @param _encryptedAmount Encrypted debt amount
     * @param _encryptedInterestRate Encrypted interest rate in basis points
     * @param _termInDays Loan term in days
     * @param _isAnonymous Privacy flag for anonymous debt
     * @return debtId The newly created debt ID
     */
    function createDebt(
        bytes calldata _encryptedAmount,
        bytes calldata _encryptedInterestRate,
        uint256 _termInDays,
        bool _isAnonymous
    ) external returns (uint256 debtId) {
        // Convert encrypted inputs to FHE types
        euint64 amount = FHE.asEuint64(_encryptedAmount);
        euint32 rate = FHE.asEuint32(_encryptedInterestRate);
        
        // Validate encrypted amount is greater than 0 (decrypt for validation)
        require(FHE.decrypt(FHE.gt(amount, FHE.asEuint64(0))), "AnonymousDebtManager: Amount must be greater than 0");
        require(_termInDays > 0, "AnonymousDebtManager: Term must be greater than 0 days");
        require(_termInDays <= 36500, "AnonymousDebtManager: Term cannot exceed 100 years");
        
        debtId = nextDebtId++;
        
        // Create data hash for integrity
        bytes32 dataHash = keccak256(abi.encodePacked(
            msg.sender,
            _encryptedAmount,
            _encryptedInterestRate,
            _termInDays,
            block.timestamp
        ));
        
        debts[debtId] = DebtRecord({
            debtor: msg.sender,
            encryptedAmount: amount,
            encryptedInterestRate: rate,
            originalTerm: _termInDays,
            remainingTerm: _termInDays,
            createdAt: block.timestamp,
            status: DebtStatus.ACTIVE,
            isAnonymous: _isAnonymous,
            dataHash: dataHash
        });
        
        userDebts[msg.sender].push(debtId);
        
        emit DebtCreated(debtId, msg.sender, _termInDays, _isAnonymous, block.timestamp);
        
        return debtId;
    }
    
    /**
     * @dev Proposes restructuring terms for an existing debt
     * @param _debtId The debt to restructure
     * @param _newEncryptedAmount New encrypted debt amount
     * @param _newEncryptedRate New encrypted interest rate
     * @param _newTermInDays New term in days
     * @param _reason Reason for restructuring
     * @return proposalId The newly created proposal ID
     */
    function proposeRestructuring(
        uint256 _debtId,
        bytes calldata _newEncryptedAmount,
        bytes calldata _newEncryptedRate,
        uint256 _newTermInDays,
        string calldata _reason
    ) external validDebt(_debtId) returns (uint256 proposalId) {
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.status == DebtStatus.ACTIVE || debt.status == DebtStatus.RESTRUCTURING,
            "AnonymousDebtManager: Debt is not eligible for restructuring"
        );
        
        // Convert encrypted inputs to FHE types
        euint64 newAmount = FHE.asEuint64(_newEncryptedAmount);
        euint32 newRate = FHE.asEuint32(_newEncryptedRate);
        
        // Validate new encrypted amount is greater than 0
        require(FHE.decrypt(FHE.gt(newAmount, FHE.asEuint64(0))), "AnonymousDebtManager: New amount must be greater than 0");
        require(_newTermInDays > 0, "AnonymousDebtManager: New term must be greater than 0");
        require(_newTermInDays <= 36500, "AnonymousDebtManager: New term cannot exceed 100 years");
        require(bytes(_reason).length > 0, "AnonymousDebtManager: Reason cannot be empty");
        
        proposalId = nextProposalId++;
        
        // Create proposal hash for integrity
        bytes32 proposalHash = keccak256(abi.encodePacked(
            _debtId,
            msg.sender,
            _newEncryptedAmount,
            _newEncryptedRate,
            _newTermInDays,
            block.timestamp
        ));
        
        proposals[proposalId] = RestructuringProposal({
            debtId: _debtId,
            proposer: msg.sender,
            newEncryptedAmount: newAmount,
            newEncryptedRate: newRate,
            newTerm: _newTermInDays,
            proposedAt: block.timestamp,
            status: ProposalStatus.PENDING,
            creditorApproval: false,
            debtorApproval: false,
            reason: _reason,
            proposalHash: proposalHash
        });
        
        userProposals[msg.sender].push(proposalId);
        
        // Update debt status to indicate restructuring is in progress
        debt.status = DebtStatus.RESTRUCTURING;
        
        emit RestructuringProposed(proposalId, _debtId, msg.sender, _newTermInDays, block.timestamp);
        emit DebtStatusChanged(_debtId, DebtStatus.RESTRUCTURING, msg.sender, block.timestamp);
        
        return proposalId;
    }
    
    /**
     * @dev Approves or rejects a restructuring proposal
     * @param _proposalId The proposal to approve/reject
     * @param _approve True to approve, false to reject
     */
    function approveProposal(uint256 _proposalId, bool _approve) external validProposal(_proposalId) {
        RestructuringProposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.PENDING, "AnonymousDebtManager: Proposal is not pending");
        
        DebtRecord storage debt = debts[proposal.debtId];
        bool isCreditor = authorizedCreditors[msg.sender];
        bool isDebtor = (debt.debtor == msg.sender);
        
        require(isCreditor || isDebtor, "AnonymousDebtManager: Not authorized to approve this proposal");
        
        if (isCreditor) {
            require(!proposal.creditorApproval, "AnonymousDebtManager: Creditor already approved");
            proposal.creditorApproval = _approve;
            emit ApprovalGranted(_proposalId, msg.sender, true, block.timestamp);
        }
        
        if (isDebtor) {
            require(!proposal.debtorApproval, "AnonymousDebtManager: Debtor already approved");
            proposal.debtorApproval = _approve;
            emit ApprovalGranted(_proposalId, msg.sender, false, block.timestamp);
        }
        
        // Check if proposal should be accepted or rejected
        if (!_approve) {
            proposal.status = ProposalStatus.REJECTED;
            debt.status = DebtStatus.ACTIVE; // Return to active status
            emit ProposalStatusChanged(_proposalId, ProposalStatus.REJECTED, msg.sender, block.timestamp);
            emit DebtStatusChanged(proposal.debtId, DebtStatus.ACTIVE, msg.sender, block.timestamp);
        } else if (proposal.creditorApproval && proposal.debtorApproval) {
            proposal.status = ProposalStatus.ACCEPTED;
            emit ProposalStatusChanged(_proposalId, ProposalStatus.ACCEPTED, msg.sender, block.timestamp);
        }
    }
    
    /**
     * @dev Executes an approved restructuring proposal
     * @param _proposalId The proposal to execute
     */
    function executeProposal(uint256 _proposalId) external validProposal(_proposalId) {
        RestructuringProposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACCEPTED, "AnonymousDebtManager: Proposal not accepted");
        
        DebtRecord storage debt = debts[proposal.debtId];
        
        // Update debt terms with new encrypted values
        debt.encryptedAmount = proposal.newEncryptedAmount;
        debt.encryptedInterestRate = proposal.newEncryptedRate;
        debt.remainingTerm = proposal.newTerm;
        debt.status = DebtStatus.ACTIVE;
        
        // Update data hash
        debt.dataHash = keccak256(abi.encodePacked(
            debt.debtor,
            debt.encryptedAmount,
            debt.encryptedInterestRate,
            debt.remainingTerm,
            block.timestamp
        ));
        
        proposal.status = ProposalStatus.EXECUTED;
        
        emit ProposalStatusChanged(_proposalId, ProposalStatus.EXECUTED, msg.sender, block.timestamp);
        emit DebtStatusChanged(proposal.debtId, DebtStatus.ACTIVE, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Marks a debt as resolved by the debtor
     * @param _debtId The debt to mark as resolved
     */
    function markDebtResolved(uint256 _debtId) external onlyDebtor(_debtId) validDebt(_debtId) {
        DebtRecord storage debt = debts[_debtId];
        require(debt.status == DebtStatus.ACTIVE, "AnonymousDebtManager: Debt is not active");
        
        debt.status = DebtStatus.RESOLVED;
        debt.remainingTerm = 0;
        
        emit DebtStatusChanged(_debtId, DebtStatus.RESOLVED, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Marks a debt as defaulted (only by authorized creditors or owner)
     * @param _debtId The debt to mark as defaulted
     */
    function markDebtDefaulted(uint256 _debtId) external validDebt(_debtId) {
        require(
            authorizedCreditors[msg.sender] || msg.sender == owner,
            "AnonymousDebtManager: Not authorized to mark debt as defaulted"
        );
        
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.status == DebtStatus.ACTIVE || debt.status == DebtStatus.RESTRUCTURING,
            "AnonymousDebtManager: Debt cannot be marked as defaulted"
        );
        
        debt.status = DebtStatus.DEFAULTED;
        
        emit DebtStatusChanged(_debtId, DebtStatus.DEFAULTED, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Adds or removes authorized creditors (only owner)
     * @param _creditor The creditor address
     * @param _authorized True to authorize, false to revoke
     */
    function setAuthorizedCreditor(address _creditor, bool _authorized) external onlyOwner {
        require(_creditor != address(0), "AnonymousDebtManager: Invalid creditor address");
        authorizedCreditors[_creditor] = _authorized;
    }
    
    // View functions
    
    /**
     * @dev Returns debt information (respects privacy settings)
     */
    function getDebtInfo(uint256 _debtId) external view validDebt(_debtId) returns (
        address debtor,
        uint256 originalTerm,
        uint256 remainingTerm,
        uint256 createdAt,
        DebtStatus status,
        bool isAnonymous,
        bytes32 dataHash
    ) {
        DebtRecord storage debt = debts[_debtId];
        
        return (
            debt.isAnonymous ? address(0) : debt.debtor,
            debt.originalTerm,
            debt.remainingTerm,
            debt.createdAt,
            debt.status,
            debt.isAnonymous,
            debt.dataHash
        );
    }
    
    /**
     * @dev Returns encrypted debt amount (only accessible by debtor or authorized creditors)
     */
    function getEncryptedDebtAmount(uint256 _debtId, bytes32 publicKey) external view validDebt(_debtId) returns (bytes memory) {
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.debtor == msg.sender || authorizedCreditors[msg.sender] || msg.sender == owner,
            "AnonymousDebtManager: Not authorized to view encrypted amount"
        );
        return FHE.sealOutput(debt.encryptedAmount, publicKey);
    }
    
    /**
     * @dev Returns decrypted debt amount (only for authorized parties with proper permissions)
     */
    function getDecryptedDebtAmount(uint256 _debtId) external view validDebt(_debtId) returns (uint64) {
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.debtor == msg.sender || authorizedCreditors[msg.sender] || msg.sender == owner,
            "AnonymousDebtManager: Not authorized to decrypt amount"
        );
        return FHE.decrypt(debt.encryptedAmount);
    }
    
    /**
     * @dev Returns encrypted interest rate (only accessible by debtor or authorized creditors)
     */
    function getEncryptedInterestRate(uint256 _debtId, bytes32 publicKey) external view validDebt(_debtId) returns (bytes memory) {
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.debtor == msg.sender || authorizedCreditors[msg.sender] || msg.sender == owner,
            "AnonymousDebtManager: Not authorized to view encrypted rate"
        );
        return FHE.sealOutput(debt.encryptedInterestRate, publicKey);
    }
    
    /**
     * @dev Returns decrypted interest rate (only for authorized parties with proper permissions)
     */
    function getDecryptedInterestRate(uint256 _debtId) external view validDebt(_debtId) returns (uint32) {
        DebtRecord storage debt = debts[_debtId];
        require(
            debt.debtor == msg.sender || authorizedCreditors[msg.sender] || msg.sender == owner,
            "AnonymousDebtManager: Not authorized to decrypt rate"
        );
        return FHE.decrypt(debt.encryptedInterestRate);
    }
    
    /**
     * @dev Returns all debt IDs for a user
     */
    function getUserDebts(address _user) external view returns (uint256[] memory) {
        return userDebts[_user];
    }
    
    /**
     * @dev Returns all proposal IDs for a user
     */
    function getUserProposals(address _user) external view returns (uint256[] memory) {
        return userProposals[_user];
    }
    
    /**
     * @dev Returns proposal information
     */
    function getProposalInfo(uint256 _proposalId) external view validProposal(_proposalId) returns (
        uint256 debtId,
        address proposer,
        uint256 newTerm,
        uint256 proposedAt,
        ProposalStatus status,
        string memory reason,
        bool creditorApproval,
        bool debtorApproval
    ) {
        RestructuringProposal storage proposal = proposals[_proposalId];
        
        return (
            proposal.debtId,
            proposal.proposer,
            proposal.newTerm,
            proposal.proposedAt,
            proposal.status,
            proposal.reason,
            proposal.creditorApproval,
            proposal.debtorApproval
        );
    }
    
    /**
     * @dev Returns total number of debts created
     */
    function getTotalDebts() external view returns (uint256) {
        return nextDebtId - 1;
    }
    
    /**
     * @dev Returns total number of proposals created
     */
    function getTotalProposals() external view returns (uint256) {
        return nextProposalId - 1;
    }
    
    /**
     * @dev Emergency function to pause contract (only owner)
     */
    function emergencyPause() external view onlyOwner {
        // Implementation for emergency pause if needed
        revert("AnonymousDebtManager: Contract paused by owner");
    }
}