const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { abi, bytecode } = require('./compile');

const provider = new HDWalletProvider(
  'Security phrase',
  // remember to change this to your own phrase!
  'https://sepolia.infura.io/v3/9879063f63e6438398e62fec86f9f7ae'
  // remember to change this to your own endpoint!
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  inbox = await new web3.eth.Contract(abi)
    .deploy({ data: bytecode, arguments: [50,0] })
    .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});

  console.log('Contract deployed to', inbox.options.address);
  provider.engine.stop();
};
deploy();
