const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const {abi, bytecode} = require('../compile');

let accounts;
let TicketSale;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    TicketSale = await new web3.eth.Contract(abi)
    .deploy({data: bytecode, arguments: [50,100]})
    .send({from: accounts[0], gasPrice: 8000000000, gas: 4700000});
});

describe("TicketSale" , () => {
    it("Deploys Contract", () => {
        //console.log(TicketSale);
        assert.ok(TicketSale.options.address);
    });

    it("Buying a ticket", async () => {
        await TicketSale.methods.buyTicket(0).send({from: accounts[1], value: 100});
        const ticketOwner = await TicketSale.methods.ticketOwners(accounts[1]).call();
        assert.equal(ticketOwner, 0);
    });

    it("Returning a ticket", async () => {
        await TicketSale.methods.buyTicket(2).send({from: accounts[2], value: 100});
        const ticketOwnerBefore = await TicketSale.methods.ticketOwners(accounts[2]).call();

        await TicketSale.methods.returnTicket(2).send({from: accounts[2] });
        const ticketOwnerAfter = await TicketSale.methods.ticketOwners(accounts[2]).call();
        assert.equal(ticketOwnerAfter, 0);
    });

    it("Offering and accepting a swap", async () => {
        await TicketSale.methods.buyTicket(4).send({from: accounts[4], value: 100});
        await TicketSale.methods.buyTicket(5).send({from: accounts[5], value: 100});

        await TicketSale.methods.offerSwap(accounts[5]).send({from: accounts[4]});
        const swapOffer = await TicketSale.methods.swapOffers(accounts[4]).call();
        assert.equal(swapOffer, accounts[5]);

        await TicketSale.methods.acceptSwap(accounts[4]).send({from: accounts[5]});
        const newOwnerTicket4 = await TicketSale.methods.ticketOwners(accounts[4]).call();
        const newOwnerTicket5 = await TicketSale.methods.ticketOwners(accounts[5]).call();
        assert.equal(newOwnerTicket4, 5);
        assert.equal(newOwnerTicket5, 4);
    });

    it("Checking the ID of a ticket someone owns", async () => {
        await TicketSale.methods.buyTicket(6).send({from: accounts[6], value: 100});
        const ticketID = await TicketSale.methods.getTicketOf(accounts[6]).call();
        assert.equal(ticketID, 6);
    });
})