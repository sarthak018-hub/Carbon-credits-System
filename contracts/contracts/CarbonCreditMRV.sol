// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title CarbonCreditMRV
 * @dev Lightweight MRV contract for carbon credit tracking (gas optimized)
 */
contract CarbonCreditMRV {
    // Events (use events instead of storage when possible)
    event SubmissionCreated(uint256 indexed submissionId, address indexed user, string ipfsHash, uint256 credits);
    event CreditsIssued(address indexed user, uint256 credits);
    event CreditTransferred(address indexed from, address indexed to, uint256 amount);
    event CreditRetired(address indexed user, uint256 amount);

    // Minimal state
    mapping(address => uint256) public activeCredits;
    mapping(address => uint256) public retiredCredits;
    mapping(string => bool) public ipfsHashUsed;
    
    uint256 public submissionCount;
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Submit carbon data - simplified
    function submitCarbonData(string calldata _ipfsHash, uint256 _creditsRequested) external returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "Invalid hash");
        require(!ipfsHashUsed[_ipfsHash], "Duplicate");
        require(_creditsRequested > 0, "Invalid credits");

        submissionCount++;
        ipfsHashUsed[_ipfsHash] = true;
        
        emit SubmissionCreated(submissionCount, msg.sender, _ipfsHash, _creditsRequested);
        return submissionCount;
    }

    // Issue credits directly to user
    function issueCredits(address _user, uint256 _amount) external onlyAdmin {
        require(_user != address(0), "Invalid user");
        require(_amount > 0, "Invalid amount");
        
        activeCredits[_user] += _amount;
        emit CreditsIssued(_user, _amount);
    }

    // Transfer credits
    function transferCredits(address _to, uint256 _amount) external {
        require(_to != address(0), "Invalid recipient");
        require(activeCredits[msg.sender] >= _amount, "Insufficient");

        activeCredits[msg.sender] -= _amount;
        activeCredits[_to] += _amount;

        emit CreditTransferred(msg.sender, _to, _amount);
    }

    // Retire credits
    function retireCredits(uint256 _amount) external {
        require(activeCredits[msg.sender] >= _amount, "Insufficient");

        activeCredits[msg.sender] -= _amount;
        retiredCredits[msg.sender] += _amount;

        emit CreditRetired(msg.sender, _amount);
    }

    // Get user balance
    function getUserCredits(address _user) external view returns (uint256 active, uint256 retired) {
        return (activeCredits[_user], retiredCredits[_user]);
    }
}
