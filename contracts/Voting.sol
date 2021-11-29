// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title A voting system contract.
 *
 * @author Cyril Castagnet
 *
 * @dev A voting system.
 */



contract Voting is Ownable {

    // arrays for draw, uint for single
    uint[] winningProposalsID;
    Proposal[] winningProposals;
    
    uint winningProposalID;
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;
    Proposal[] public proposalsArray;
    mapping (address => Voter) private voters;

    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    /**
     * @dev Check if the sender is registered in the voters list.
     */

    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }
    
    // on peut faire un modifier pour les états

    // ::::::::::::: GETTERS ::::::::::::: //
    /**
     * @dev Get a voter information.
     *
     * @param _addr The voter address.
     *
     * @return Voter The voter.
     */


    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }


    /**
     * @dev Get a proposal information with an the proposal id.
     *
     * @param _id The proposal id.
     *
     * @return Proposal The proposal information.
     */

    
    function getOneProposal(uint _id) external view returns (Proposal memory) {
        return proposalsArray[_id];
    }

 /**
     * @dev Get a list of winning proposal ids.
     *
     * @return A list of winning proposal ids, in an array[].
     */

    // ne pas tester
    function getWinners() external view returns (Proposal[] memory) {
        require(workflowStatus == WorkflowStatus.VotesTallied, 'Votes are not tallied yet');
        return winningProposals; // return proposalsArray[winningProposalID];
    }
    

    function getWinner() external view returns (Proposal memory) {
        require(workflowStatus == WorkflowStatus.VotesTallied, 'Votes are not tallied yet');
        return proposalsArray[winningProposalID];
    }
 
    // ::::::::::::: REGISTRATION ::::::::::::: // 

        /**
     * @dev Add a voter address into the voters list.
     *
     * @param _addr The voter address.
     */

    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');
    
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }
 
    /* facultatif
     * function deleteVoter(address _addr) external onlyOwner {
     *   require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
     *   require(voters[_addr].isRegistered == true, 'Not registered.');
     *   voters[_addr].isRegistered = false;
     *  emit VoterRegistered(_addr);
    }*/

    // ::::::::::::: PROPOSAL ::::::::::::: // 

        /**
     * @dev Add a proposal with a description.
     *
     * @param _desc The description of the proposal.
     */

    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer'); // facultatif
        // voir que desc est different des autres

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /**
     * @dev Vote to a proposal.
     *
     * @param _id The proposal id.
     */

    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id <= proposalsArray.length, 'Proposal not found'); // pas obligé, et pas besoin du >0 car uint

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //

    /* on pourrait factoriser tout ça: par exemple:
    *  function setWorkflowStatus(WorkflowStatus _num) public onlyOwner {
    *    WorkflowStatus pnum = workflowStatus;
    *    workflowStatus = _num;
    *    emit WorkflowStatusChange(pnum, workflowStatus);
        } */ 

    /**
     * @dev Start to register proposals.
     */

    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

        /**
     * @dev Stop registering proposals.
     */

    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
     * @dev Start the voting session.
     */

    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /**
     * @dev Stop the voting session.
     */

    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    // ne pas tester
    function tallyVotesDraw() external onlyOwner {
       require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint highestCount;
        uint[5] memory winners; // egalite entre 5 proposals max
        uint nbWinners;
        for (uint i = 0; i < proposalsArray.length; i++) {
            if (nbWinners<5){
                if (proposalsArray[i].voteCount == highestCount) {
                    winners[nbWinners]=i;
                    nbWinners++;
                }
                if (proposalsArray[i].voteCount > highestCount) {
                    delete winners;
                    winners[0]= i;
                    highestCount = proposalsArray[i].voteCount;
                    nbWinners=1;
                }
            }
        }
        for(uint j=0;j<nbWinners;j++){
            winningProposalsID.push(winners[j]);
            winningProposals.push(proposalsArray[winners[j]]);
        }
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    /**
     * @dev Tally all votes. Sort into voteCounts in for loop mapping all the proposalIds by vote counted then store the hightest vote count.
     */

    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                _winningProposalId = p;
            }
        }
        winningProposalID = _winningProposalId;
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}