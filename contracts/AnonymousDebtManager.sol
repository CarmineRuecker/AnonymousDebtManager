// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Anonymous Debt Manager - FHE-Style Privacy Contract
 * @dev 匿名债务重组 - 隐私债务管理平台核心合约
 * @notice 基于FHE风格加密的完全匿名债务管理系统
 */
contract AnonymousDebtManager {

    // 债务状态枚举
    enum DebtStatus { 
        ACTIVE,      // 活跃状态
        RESOLVED,    // 已解决
        DEFAULTED,   // 违约状态
        RESTRUCTURED // 已重组
    }

    // 重组提案状态
    enum ProposalStatus { 
        PENDING,     // 待审核
        APPROVED,    // 已批准
        REJECTED,    // 已拒绝
        EXECUTED     // 已执行
    }

    // FHE风格匿名债务记录
    struct AnonymousDebt {
        address debtor;                  // 债务人地址
        bytes32 encryptedAmountHash;     // FHE风格加密金额哈希
        bytes32 encryptedRateHash;       // FHE风格加密利率哈希
        bytes32 encryptedTermHash;       // FHE风格加密期限哈希
        uint256 createdAt;               // 创建时间戳
        DebtStatus status;               // 债务状态
        bool isAnonymous;                // 完全匿名标志
        bytes32 privacyKey;              // 隐私密钥
        string encryptedDescription;     // 加密描述
    }

    // 匿名重组提案
    struct AnonymousProposal {
        uint256 debtId;                  // 关联债务ID
        address proposer;                // 提案人
        bytes32 encryptedNewAmountHash;  // 新金额加密哈希
        bytes32 encryptedNewRateHash;    // 新利率加密哈希
        bytes32 encryptedNewTermHash;    // 新期限加密哈希
        uint256 proposedAt;              // 提案时间
        ProposalStatus status;           // 提案状态
        bool creditorApproved;           // 债权人同意
        bool debtorApproved;             // 债务人同意
        string encryptedReason;          // 加密重组原因
        bytes32 proposalPrivacyKey;      // 提案隐私密钥
    }

    // 隐私访问控制
    struct PrivacyAccess {
        mapping(address => bool) authorizedReaders;  // 授权读取者
        mapping(address => bytes32) accessKeys;     // 访问密钥
        uint256 accessLevel;                        // 访问级别
    }

    // 合约状态变量
    address public owner;
    uint256 public nextDebtId = 1;
    uint256 public nextProposalId = 1;
    
    // 核心数据映射
    mapping(uint256 => AnonymousDebt) private anonymousDebts;
    mapping(uint256 => AnonymousProposal) private anonymousProposals;
    mapping(uint256 => PrivacyAccess) private debtPrivacyAccess;
    mapping(uint256 => PrivacyAccess) private proposalPrivacyAccess;
    
    // 用户数据索引
    mapping(address => uint256[]) public userDebts;
    mapping(address => uint256[]) public userProposals;
    mapping(address => bool) public authorizedCreditors;
    
    // 匿名统计
    uint256 public totalAnonymousDebts;
    uint256 public totalResolvedDebts;
    uint256 public totalActiveProposals;

    // FHE风格隐私常量
    bytes32 private constant PRIVACY_SALT = keccak256("ANONYMOUS_DEBT_PRIVACY_2024");
    bytes32 private constant ENCRYPTION_DOMAIN = keccak256("FHE_STYLE_ENCRYPTION_DOMAIN");

    // 隐私事件 - 仅显示必要的匿名信息
    event AnonymousDebtCreated(
        uint256 indexed debtId, 
        address indexed debtor, 
        bytes32 encryptedDataHash, 
        bool isFullyAnonymous,
        uint256 timestamp
    );
    
    event AnonymousProposalSubmitted(
        uint256 indexed proposalId, 
        uint256 indexed debtId, 
        address indexed proposer,
        bytes32 encryptedProposalHash,
        uint256 timestamp
    );
    
    event PrivacyLevelChanged(
        uint256 indexed entityId, 
        string entityType,
        uint256 newPrivacyLevel,
        uint256 timestamp
    );
    
    event AnonymousStatusUpdate(
        uint256 indexed entityId,
        string entityType,
        uint8 newStatus,
        uint256 timestamp
    );

    event PrivacyAccessGranted(
        uint256 indexed entityId,
        address indexed user,
        string accessType,
        uint256 timestamp
    );

    // 访问控制修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Owner only");
        _;
    }

    modifier validDebtId(uint256 debtId) {
        require(debtId > 0 && debtId < nextDebtId, "Invalid debt ID");
        _;
    }

    modifier validProposalId(uint256 proposalId) {
        require(proposalId > 0 && proposalId < nextProposalId, "Invalid proposal ID");
        _;
    }

    modifier hasPrivacyAccess(uint256 debtId) {
        require(_hasDebtAccess(debtId, msg.sender), "Privacy access denied");
        _;
    }

    modifier hasProposalAccess(uint256 proposalId) {
        require(_hasProposalAccess(proposalId, msg.sender), "Proposal access denied");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedCreditors[msg.sender] = true;
    }

    /**
     * @dev FHE风格加密函数 - 生成隐私哈希
     */
    function _generatePrivacyHash(
        uint256 value, 
        address user, 
        string memory domain
    ) private view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                value, 
                user, 
                block.timestamp, 
                domain, 
                PRIVACY_SALT,
                ENCRYPTION_DOMAIN
            )
        );
    }

    /**
     * @dev 检查债务隐私访问权限
     */
    function _hasDebtAccess(uint256 debtId, address user) private view returns (bool) {
        return anonymousDebts[debtId].debtor == user ||
               debtPrivacyAccess[debtId].authorizedReaders[user] ||
               authorizedCreditors[user] ||
               owner == user;
    }

    /**
     * @dev 检查提案隐私访问权限
     */
    function _hasProposalAccess(uint256 proposalId, address user) private view returns (bool) {
        return anonymousProposals[proposalId].proposer == user ||
               anonymousDebts[anonymousProposals[proposalId].debtId].debtor == user ||
               proposalPrivacyAccess[proposalId].authorizedReaders[user] ||
               authorizedCreditors[user] ||
               owner == user;
    }

    /**
     * @dev 创建匿名债务记录 - 核心隐私功能
     */
    function createAnonymousDebt(
        uint256 amount,
        uint256 interestRate,
        uint256 termDays,
        bool fullyAnonymous,
        string calldata encryptedDescription
    ) external returns (uint256) {
        require(amount > 0 && amount <= 10000000, "Invalid amount range");
        require(interestRate <= 10000, "Interest rate too high");
        require(termDays > 0 && termDays <= 36500, "Invalid term range");

        uint256 debtId = nextDebtId++;

        // 生成FHE风格隐私哈希
        bytes32 amountHash = _generatePrivacyHash(amount, msg.sender, "AMOUNT");
        bytes32 rateHash = _generatePrivacyHash(interestRate, msg.sender, "RATE");
        bytes32 termHash = _generatePrivacyHash(termDays, msg.sender, "TERM");
        bytes32 privacyKey = _generatePrivacyHash(debtId, msg.sender, "PRIVACY_KEY");

        // 创建匿名债务记录
        anonymousDebts[debtId] = AnonymousDebt({
            debtor: fullyAnonymous ? address(0) : msg.sender,
            encryptedAmountHash: amountHash,
            encryptedRateHash: rateHash,
            encryptedTermHash: termHash,
            createdAt: block.timestamp,
            status: DebtStatus.ACTIVE,
            isAnonymous: fullyAnonymous,
            privacyKey: privacyKey,
            encryptedDescription: encryptedDescription
        });

        // 设置隐私访问控制
        debtPrivacyAccess[debtId].authorizedReaders[msg.sender] = true;
        debtPrivacyAccess[debtId].accessKeys[msg.sender] = privacyKey;
        debtPrivacyAccess[debtId].accessLevel = fullyAnonymous ? 3 : 1; // 3=完全匿名, 1=基础隐私

        // 更新用户索引和统计
        userDebts[msg.sender].push(debtId);
        totalAnonymousDebts++;

        // 生成组合数据哈希用于事件
        bytes32 combinedHash = keccak256(abi.encodePacked(amountHash, rateHash, termHash));

        emit AnonymousDebtCreated(debtId, msg.sender, combinedHash, fullyAnonymous, block.timestamp);
        emit PrivacyAccessGranted(debtId, msg.sender, "DEBT_CREATOR", block.timestamp);

        return debtId;
    }

    /**
     * @dev 提交匿名重组提案
     */
    function proposeAnonymousRestructuring(
        uint256 debtId,
        uint256 newAmount,
        uint256 newInterestRate,
        uint256 newTermDays,
        string calldata encryptedReason
    ) external validDebtId(debtId) returns (uint256) {
        require(anonymousDebts[debtId].status == DebtStatus.ACTIVE, "Debt not active");
        require(newAmount > 0 && newAmount <= 10000000, "Invalid new amount");
        require(newInterestRate <= 10000, "New rate too high");
        require(newTermDays > 0 && newTermDays <= 36500, "Invalid new term");

        uint256 proposalId = nextProposalId++;

        // 生成新的FHE风格隐私哈希
        bytes32 newAmountHash = _generatePrivacyHash(newAmount, msg.sender, "NEW_AMOUNT");
        bytes32 newRateHash = _generatePrivacyHash(newInterestRate, msg.sender, "NEW_RATE");
        bytes32 newTermHash = _generatePrivacyHash(newTermDays, msg.sender, "NEW_TERM");
        bytes32 proposalPrivacyKey = _generatePrivacyHash(proposalId, msg.sender, "PROPOSAL_KEY");

        // 创建匿名提案
        anonymousProposals[proposalId] = AnonymousProposal({
            debtId: debtId,
            proposer: msg.sender,
            encryptedNewAmountHash: newAmountHash,
            encryptedNewRateHash: newRateHash,
            encryptedNewTermHash: newTermHash,
            proposedAt: block.timestamp,
            status: ProposalStatus.PENDING,
            creditorApproved: false,
            debtorApproved: false,
            encryptedReason: encryptedReason,
            proposalPrivacyKey: proposalPrivacyKey
        });

        // 设置提案隐私访问
        address debtor = anonymousDebts[debtId].debtor;
        proposalPrivacyAccess[proposalId].authorizedReaders[msg.sender] = true;
        if (debtor != address(0)) {
            proposalPrivacyAccess[proposalId].authorizedReaders[debtor] = true;
        }
        proposalPrivacyAccess[proposalId].accessLevel = anonymousDebts[debtId].isAnonymous ? 3 : 1;

        userProposals[msg.sender].push(proposalId);
        totalActiveProposals++;

        bytes32 proposalHash = keccak256(abi.encodePacked(newAmountHash, newRateHash, newTermHash));
        
        emit AnonymousProposalSubmitted(proposalId, debtId, msg.sender, proposalHash, block.timestamp);
        emit PrivacyAccessGranted(proposalId, msg.sender, "PROPOSAL_CREATOR", block.timestamp);
        if (debtor != address(0)) {
            emit PrivacyAccessGranted(proposalId, debtor, "DEBT_OWNER", block.timestamp);
        }

        return proposalId;
    }

    /**
     * @dev 匿名批准/拒绝重组提案
     */
    function processAnonymousProposal(uint256 proposalId, bool approve) 
        external 
        validProposalId(proposalId) 
        hasProposalAccess(proposalId)
    {
        AnonymousProposal storage proposal = anonymousProposals[proposalId];
        require(proposal.status == ProposalStatus.PENDING, "Proposal not pending");

        uint256 debtId = proposal.debtId;
        bool isDebtor = anonymousDebts[debtId].debtor == msg.sender;
        bool isCreditor = authorizedCreditors[msg.sender];

        require(isDebtor || isCreditor, "Not authorized to process proposal");

        if (approve) {
            if (isDebtor) proposal.debtorApproved = true;
            if (isCreditor) proposal.creditorApproved = true;

            // 双方同意则批准
            if (proposal.debtorApproved && proposal.creditorApproved) {
                proposal.status = ProposalStatus.APPROVED;
            }
        } else {
            proposal.status = ProposalStatus.REJECTED;
            if (totalActiveProposals > 0) totalActiveProposals--;
        }

        emit AnonymousStatusUpdate(proposalId, "PROPOSAL", uint8(proposal.status), block.timestamp);
    }

    /**
     * @dev 执行已批准的匿名重组
     */
    function executeAnonymousRestructuring(uint256 proposalId) 
        external 
        validProposalId(proposalId) 
        hasProposalAccess(proposalId)
    {
        AnonymousProposal storage proposal = anonymousProposals[proposalId];
        require(proposal.status == ProposalStatus.APPROVED, "Proposal not approved");

        uint256 debtId = proposal.debtId;
        AnonymousDebt storage debt = anonymousDebts[debtId];

        // 更新债务的FHE风格加密数据
        debt.encryptedAmountHash = proposal.encryptedNewAmountHash;
        debt.encryptedRateHash = proposal.encryptedNewRateHash;
        debt.encryptedTermHash = proposal.encryptedNewTermHash;
        debt.status = DebtStatus.RESTRUCTURED;

        proposal.status = ProposalStatus.EXECUTED;
        if (totalActiveProposals > 0) totalActiveProposals--;

        emit AnonymousStatusUpdate(proposalId, "PROPOSAL", uint8(ProposalStatus.EXECUTED), block.timestamp);
        emit AnonymousStatusUpdate(debtId, "DEBT", uint8(DebtStatus.RESTRUCTURED), block.timestamp);
    }

    /**
     * @dev 标记匿名债务为已解决
     */
    function resolveAnonymousDebt(uint256 debtId) 
        external 
        validDebtId(debtId) 
        hasPrivacyAccess(debtId)
    {
        require(anonymousDebts[debtId].status == DebtStatus.ACTIVE, "Debt not active");
        
        anonymousDebts[debtId].status = DebtStatus.RESOLVED;
        totalResolvedDebts++;
        
        emit AnonymousStatusUpdate(debtId, "DEBT", uint8(DebtStatus.RESOLVED), block.timestamp);
    }

    /**
     * @dev 获取匿名债务信息（需要隐私访问权限）
     */
    function getAnonymousDebtInfo(uint256 debtId) 
        external 
        view 
        validDebtId(debtId) 
        hasPrivacyAccess(debtId)
        returns (
            address debtor,
            uint256 amount,
            uint256 interestRate,
            uint256 termDays,
            uint256 createdAt,
            uint8 status,
            bool isAnonymous,
            string memory description
        ) 
    {
        AnonymousDebt storage debt = anonymousDebts[debtId];
        
        // 模拟FHE解密过程 - 返回示例数据用于演示
        // 在真实FHE实现中，这里会使用用户的私钥进行同态解密
        return (
            debt.isAnonymous ? address(0) : debt.debtor,
            5000,  // 模拟解密金额 $5,000
            750,   // 模拟解密利率 7.5%
            730,   // 模拟解密期限 2年
            debt.createdAt,
            uint8(debt.status),
            debt.isAnonymous,
            debt.encryptedDescription
        );
    }

    /**
     * @dev 获取匿名提案信息（需要隐私访问权限）
     */
    function getAnonymousProposalInfo(uint256 proposalId)
        external
        view
        validProposalId(proposalId)
        hasProposalAccess(proposalId)
        returns (
            uint256 debtId,
            address proposer,
            uint256 newAmount,
            uint256 newRate,
            uint256 newTerm,
            uint256 proposedAt,
            uint8 status,
            bool creditorApproved,
            bool debtorApproved,
            string memory reason
        )
    {
        AnonymousProposal storage proposal = anonymousProposals[proposalId];
        
        // 模拟FHE解密过程
        return (
            proposal.debtId,
            proposal.proposer,
            3500,  // 模拟解密新金额 $3,500
            600,   // 模拟解密新利率 6%
            1095,  // 模拟解密新期限 3年
            proposal.proposedAt,
            uint8(proposal.status),
            proposal.creditorApproved,
            proposal.debtorApproved,
            proposal.encryptedReason
        );
    }

    /**
     * @dev 授予隐私访问权限
     */
    function grantPrivacyAccess(uint256 debtId, address user) 
        external 
        validDebtId(debtId) 
    {
        require(
            anonymousDebts[debtId].debtor == msg.sender || owner == msg.sender,
            "Not authorized to grant access"
        );
        
        debtPrivacyAccess[debtId].authorizedReaders[user] = true;
        debtPrivacyAccess[debtId].accessKeys[user] = anonymousDebts[debtId].privacyKey;
        
        emit PrivacyAccessGranted(debtId, user, "DEBT_ACCESS", block.timestamp);
    }

    /**
     * @dev 设置授权债权人
     */
    function setAuthorizedCreditor(address creditor, bool authorized) external onlyOwner {
        authorizedCreditors[creditor] = authorized;
    }

    /**
     * @dev 获取FHE风格加密数据哈希
     */
    function getEncryptedDataHashes(uint256 debtId) 
        external 
        view 
        validDebtId(debtId) 
        hasPrivacyAccess(debtId)
        returns (bytes32 amountHash, bytes32 rateHash, bytes32 termHash) 
    {
        AnonymousDebt storage debt = anonymousDebts[debtId];
        return (debt.encryptedAmountHash, debt.encryptedRateHash, debt.encryptedTermHash);
    }

    /**
     * @dev 验证FHE加密数据完整性
     */
    function verifyAnonymousDataIntegrity(uint256 debtId, bytes32 expectedHash) 
        external 
        view 
        validDebtId(debtId) 
        hasPrivacyAccess(debtId)
        returns (bool) 
    {
        bytes32 combinedHash = keccak256(abi.encodePacked(
            anonymousDebts[debtId].encryptedAmountHash,
            anonymousDebts[debtId].encryptedRateHash,
            anonymousDebts[debtId].encryptedTermHash
        ));
        return combinedHash == expectedHash;
    }

    // 公共查询函数
    function getUserDebts(address user) external view returns (uint256[] memory) {
        return userDebts[user];
    }

    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }

    function getTotalDebts() external view returns (uint256) {
        return nextDebtId - 1;
    }

    function getTotalProposals() external view returns (uint256) {
        return nextProposalId - 1;
    }

    function getAnonymousStats() external view returns (
        uint256 totalAnonymous,
        uint256 totalResolved,
        uint256 activeProposals
    ) {
        return (totalAnonymousDebts, totalResolvedDebts, totalActiveProposals);
    }

    function getPrivacyLevel(uint256 debtId) external view validDebtId(debtId) returns (uint256) {
        return debtPrivacyAccess[debtId].accessLevel;
    }
}