// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract TicketSale {
    address payable public manager;
    uint public numTickets;
    uint public price;

    struct Ticket {
        bool isSold;
        address owner;
    }

    Ticket[] public tickets;
    mapping(address => uint) public ticketOwners;
    mapping(address => address) public swapOffers;

    constructor(uint _numTickets, uint _price) {
        manager = payable(msg.sender);
        numTickets = _numTickets;
        price = _price;
        for (uint i = 0; i < numTickets; i++) {
            tickets.push(Ticket(false, address(0)));
        }
    }

    function buyTicket(uint ticketId) public payable returns (bool, bytes memory) {
        bool success;
        bytes memory data;

        require(msg.sender != manager, "Owner cannot purchase tickets.");
        require(ticketOwners[msg.sender] == 0, "You already own a ticket.");
        require(ticketId < numTickets, "Invalid ticket ID.");
        require(!tickets[ticketId].isSold, "Ticket is already sold.");
        require(msg.value == price, "Incorrect amount of ether sent.");

        tickets[ticketId].isSold = true;
        tickets[ticketId].owner = msg.sender;
        ticketOwners[msg.sender] = ticketId;
        (success, data) = manager.call{value: uint(price)}("");
        return (success, data);
    }

    function getTicketOf(address person) public view returns (uint) {
        return ticketOwners[person];
    }

    function offerSwap(address partner) public {
        require(ticketOwners[msg.sender] > 0, "You do not have a ticket to swap.");
        require(ticketOwners[partner] > 0, "Partner does not have a ticket to swap.");
        swapOffers[msg.sender] = partner;
    }

    function acceptSwap(address partner) public {
        require(ticketOwners[msg.sender] > 0, "You do not have a ticket to swap.");
        require(swapOffers[partner] == msg.sender, "No swap offer from the partner.");
        
        uint myTicketId = ticketOwners[msg.sender];
        uint partnerTicketId = ticketOwners[partner];

        tickets[myTicketId].owner = partner;
        tickets[partnerTicketId].owner = msg.sender;

        delete swapOffers[partner];
        ticketOwners[msg.sender] = partnerTicketId;
        ticketOwners[partner] = myTicketId;
    
    }

    function returnTicket(uint ticketId) public payable returns (bool, bytes memory){
        bool success;
        bytes memory data;

        require(msg.sender == tickets[ticketId].owner, "You are not the owner of this ticket.");

        uint refundAmount = (price * 90) / 100;
        (success, data) = tickets[ticketId].owner.call{value: uint(refundAmount)}("");

        tickets[ticketId].isSold = false;
        tickets[ticketId].owner = address(0);
        ticketOwners[msg.sender] = 0;

        return (success, data);
    }
}
