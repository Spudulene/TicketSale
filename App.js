import './App.css';
import React from 'react';
import web3 from './web3';
import ticketSale from './ticketsale';

class App extends React.Component {
  state = {
    manager:'',
    availableTickets: [],
    ownerTickets: [],
    currentAccount:'',
    accounts: [],
    ticketId: '',
    swapPartnerTo: '',
    swapPartnerFrom:'',
    returnTicketId: '',
    weiAmount: '',
    price: '',
    purchaseMessage:'',
    returnMessage:'',
    offerSwapMessage:'',
    acceptSwapMessage:''
  };

  async componentDidMount() {
    await this.loadContractData();
    this.setupAccountChangeListener();
  }

  componentWillUnmount() {
    // Remove the account change listener when the component is unmounted
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", this.handleAccountsChanged);
    }
  }

  loadContractData = async() => {
    const manager = await ticketSale.methods.manager().call();
    const price = await ticketSale.methods.price().call();
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];
    this.getOwnersAndTickets();
    this.setState({currentAccount, manager, accounts, price})
  }

  setupAccountChangeListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", this.handleAccountsChanged);
    }
  };

  handleAccountsChanged = (accounts) => {
    const currentAccount = accounts[0];
    this.setState({ accounts, currentAccount }, () => {
      this.loadContractData();
    });
  };

  buyTicket = async (event) => {
    event.preventDefault();
    try{
      const { ticketId } = this.state;
      this.setState({purchaseMessage: 'Purchasing Ticket!'})
      await ticketSale.methods.buyTicket(ticketId).send({
        from: this.state.currentAccount,
        value: this.state.price,
        gasPrice: '8000000000',
        gas: '4700000',
      });
      this.setState({purchaseMessage: 'Ticket Purchased!'})
      this.getOwnersAndTickets();
    }
    catch (error)
      {
        console.error('Error:',error.message);
        this.setState({purchaseMessage: 'There was an error purchasing your ticket.'})
      }
  };

  offerSwap = async (event) => {
    event.preventDefault();
    try{
      this.setState({offerSwapMessage:'Offering Swap!'})
      const { swapPartnerTo } = this.state;
      await ticketSale.methods.offerSwap(swapPartnerTo).send({
      from: this.state.currentAccount,
      gasPrice: '8000000000',
      gas: '4700000',
      });
      this.setState({offerSwapMessage:'Offer sent to: ' + swapPartnerTo})
    }
    catch(error){
      console.log('Error:',error.message)
      this.setState({offerSwapMessage:'There was an error offering to swap'})
    }
  };

  acceptSwap = async (event) => {
    event.preventDefault();
    const { swapPartnerFrom } = this.state;
    try{
      this.setState({acceptSwapMessage:'Accepting Swap!'})
      await ticketSale.methods.acceptSwap(swapPartnerFrom).send({
        from: this.state.currentAccount,
        gasPrice: '8000000000',
        gas: '4700000',
      });
      this.setState({acceptSwapMessage:'You have succesfully swapped tickets with: ' + swapPartnerFrom})
      this.getOwnersAndTickets();
    }
    catch(error){
      console.log('Error',error.message)
      this.setState({acceptSwapMessage:'There was an error accepting a swap from ' + swapPartnerFrom })
    }
  };

  returnTicket = async (event) => {
    event.preventDefault();
    try{
      this.setState({returnMessage:'Returning Ticket!'})
      const { returnTicketId } = this.state;
      await ticketSale.methods.returnTicket(returnTicketId).send({
      from: this.state.currentAccount,
      gasPrice: '8000000000',
      gas: '4700000',
    });
    this.setState({returnMessage:'Ticket succesfully returned!'})
    this.getOwnersAndTickets();
  }
    catch(error){
      this.setState({returnMessage:'There was an error returning your ticket.'})
      console.log('Error: ', error.message)
    }
  };

  getOwnersAndTickets = async () => {
    const { accounts } = this.state;
    const numTickets = await ticketSale.methods.numTickets().call({ from: accounts[0] });
    const availableTickets = [];
    const ownerTickets = [];
    for (let ticketId = 0; ticketId < numTickets; ticketId++) {
        const ticket = await ticketSale.methods.tickets(ticketId).call();
      if (!(ticket.isSold)) {
        availableTickets.push(ticketId);
      }
      else {
        const owner = ticket.owner;
        ownerTickets.push({ owner, ticketId });
      }
    }
    this.setState({ ownerTickets, availableTickets})
  };

  renderAvailableTickets = () => {
    const { availableTickets } = this.state;
    if (availableTickets.length === 0) {
      return <p>No available tickets</p>;
    }
    const ticketList = availableTickets.join(', ');
    return (
      <div>
        <h3>Available Tickets: </h3>
        <p>{ticketList}</p>
      </div>
    )
  };

  renderOwnerTickets = () => {
    const { ownerTickets } = this.state;
    if (ownerTickets.length === 0) {
      return <p>No tickets owned</p>;
    }
    return (
      <div>
        <h3>Owners and their Tickets:</h3>
        <ul>
          {ownerTickets.map((ticketInfo) => (
            <li key={ticketInfo.ticketId}>
              Owner: {ticketInfo.owner}, Ticket ID: {ticketInfo.ticketId}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  render() {
    return (
      <div className='App'>
        <h2>Ticket Sale Contract</h2>
        This is run by {this.state.manager}
        {this.renderAvailableTickets()}
        {this.renderOwnerTickets()}

        {/* Purchasing ticket */}
        <div>
          <label htmlFor='ticketId'>Ticket ID:</label>
          <input
            type='number'
            id='ticketId'
            value={this.state.ticketId}
            onChange={(e) => this.setState({ ticketId: e.target.value })}
          />
          <button onClick={this.buyTicket}>Buy Ticket</button>
          <h4>{this.state.purchaseMessage}<br/></h4>

        </div>

        {/* Offering swap to an address */}
        <div>
          <label htmlFor='swapPartnerTo'>Offer Swap To:</label>
          <input
            type='text'
            id='swapPartnerTo'
            value={this.state.swapPartnerTo}
            onChange={(e) => this.setState({ swapPartnerTo: e.target.value })}
          />
          <button onClick={this.offerSwap}>Offer Swap</button>
          <h4>{this.state.offerSwapMessage}<br/></h4>
        </div>
        
        {/* Accepting swap from an address */}
        <div>
        <label htmlFor='swapPartnerFrom'>Accept Swap From:</label>
          <input
            type='text'
            id='swapPartnerFrom'
            value={this.state.swapPartnerFrom}
            onChange={(e) => this.setState({ swapPartnerFrom: e.target.value })}
          />
          <button onClick={this.acceptSwap}>Accept Swap</button>
          <h4>{this.state.acceptSwapMessage}<br/></h4>
        </div>

        {/* Returning a ticket */}
        <div>
          <label htmlFor='returnTicketId'>Ticket ID:</label>
          <input
            type='number'
            id='returnTicketId'
            value={this.state.returnTicketId}
            onChange={(e) => this.setState({ returnTicketId: e.target.value })}
          />
          <button onClick={this.returnTicket}>Return Ticket</button>
          <h4>{this.state.returnMessage}<br/></h4>
        </div>
      </div>
    );
  }
}

export default App;