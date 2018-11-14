const Web3 = require('web3'); // web 1.0.0
const Caver = require('caver-js');
const console = require('console');
const HDWalletProvider = require("truffle-hdwallet-provider");

// Provider
const mnemonic = "trust cattle hungry top brown guilt over item news predict salmon skill";
networks = {
    local: {
        url: 'http://localhost:8545',
        gas: 90000000000,
        gasPrice: '1'
    },
    ropsten: {
        url: 'https://ropsten.infura.io/H1k68oRrrO6mYsa4jmnC',
        gas: 5000000,
        gasPrice: '10000000000'
    },
    klaytn: {
        url: "http://192.168.3.102:8551",
        gas: 20000000,
        gasPrice: '25000000000'
    }
}

if (process.argv.length != 3) {
    console.log('Wrong arguments.');
    process.exit();
}
const networkName = process.argv[2];
var web3;
var web3_eth;
var provider;
switch (networkName) {
    case 'local':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3 = new Web3(provider);
        web3_eth = web3.eth;
        break;
    case 'ropsten':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3 = new Web3(provider);
        web3_eth = web3.eth;
        break;
    case 'klaytn':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3 = new Caver(provider);
        web3_eth = web3.klay;
        break;
    default:
        console.log('Wrong arguments.');
        process.exit();
}
var gasPrice = networks[networkName].gasPrice;
var gasLimit = networks[networkName].gas;


// functions
function logContractBuild(contractBuildJson) {
    console.log('contractName:' + contractBuildJson.contractName);
    console.log('bytecode:' + contractBuildJson.bytecode);
    console.log('abi:' + contractBuildJson.abi);
}

const deployContract = async (buildFilePath, args, sender) => {
    const contractBuildJson = require(buildFilePath);
    // logContractBuild(contractBuildJson);

    const contract = new web3_eth.Contract(contractBuildJson.abi);
    contract.options.gasPrice = gasPrice;
    contract.options.gas = gasLimit;

    const deployMethod = contract.deploy({
        data: contractBuildJson.bytecode,
        arguments: args
    });

    // deploy contract
    var receipt;
    await deployMethod.send({ from: sender }).on('receipt', function (returns) {
        receipt = returns;
    });

    contract.options.address = receipt.contractAddress;
    return [contract, receipt];
}
const createContract = async (buildFilePath, contractAddress) => {
    const contractBuildJson = require(buildFilePath);

    const contract = new web3_eth.Contract(contractBuildJson.abi);
    contract.options.gasPrice = gasPrice;
    contract.options.gas = gasLimit;
    contract.options.address = contractAddress;

    return contract;
}

var receiptCount = 0;
var gasAmount = 0;
const printReceipt = (contractName, method, sender, args, receipt) => {
    gasAmount += receipt.gasUsed;
    const txFee = receipt.gasUsed * networks['klaytn'].gasPrice / Math.pow(10, 18);
    const txFeeAmount = gasAmount * networks['klaytn'].gasPrice / Math.pow(10, 18);
    // const txFee = receipt.gasUsed * gasPrice / Math.pow(10, 18);
    // const txFeeAmount = gasAmount * gasPrice / Math.pow(10, 18);
    console.log(++receiptCount + '\t' + receipt.blockNumber + '\t' + contractName + '\t' + method + '\t' + sender + '\t' + args + '\t' + receipt.gasUsed + '\t' + gasAmount + '\t' + txFee + '\t' + txFeeAmount);
}

// main test
const exec = async () => {
    // account list
    const accounts = await web3_eth.getAccounts();
    const account = accounts[0];

    var [studentProxy, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/Proxy.json", ['0xCF1d1aCA6599f3c7abf1eBF80B1D84Ac95D98f5E'], account);

    // deploy contracts
    // ScoreV1
    var [scoreV1Contract, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/ScoreV1.json", [], account);
    printReceipt("ScoreV1", "new", account, '', receipt);
    // ScoreV2
    var [scoreV2Contract, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/ScoreV2.json", [], account);
    printReceipt("ScoreV2", "new", account, '', receipt);
    // ScoreProxy
    var [scoreProxy, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/Proxy.json", [scoreV1Contract.options.address], account);
    printReceipt("ScoreProxy", "new", account, scoreV1Contract.options.address, receipt);
    var scoreInterface = await createContract("../../solidity-upgradable-contracts/build/contracts/ScoreV1.json", scoreProxy.options.address);
    // console.log('proxy:' + scoreProxy.options.address + ', interface:' + scoreInterface.options.address + ', logic:' + scoreV1Contract.options.address);

    // ScoreV1 : hit
    for (i = 0; i < 3; i++) {
        receipt = await scoreV1Contract.methods.hit().send({ from: account });
        printReceipt("ScoreV1", "hit", account, '', receipt);
        console.log('ScoreV1 score:' + await scoreV1Contract.methods.score().call({ from: account }));
    }

    // ScoreProxy(v1) : hit
    for (i = 0; i < 5; i++) {
        receipt = await scoreInterface.methods.hit().send({ from: account });
        printReceipt("ScoreProxy", "hit", account, '', receipt);
        console.log('ScoreProxy score:' + await scoreInterface.methods.score().call({ from: account }));
    }

    // ScoreV2 : hit
    for (i = 0; i < 4; i++) {
        receipt = await scoreV2Contract.methods.hit().send({ from: account });
        printReceipt("ScoreV2", "hit", account, '', receipt);
        console.log('ScoreV2 score:' + await scoreV2Contract.methods.score().call({ from: account }));
    }

    // ScoreProxy(v2) : upgrade
    receipt = await scoreProxy.methods.setTargetAddress(scoreV2Contract.options.address).send({ from: account });
    printReceipt("ScoreProxy", "setTargetAddress", account, scoreV2Contract.options.address, receipt);

    // ScoreProxy(v2) : hit
    for (i = 0; i < 3; i++) {
        receipt = await scoreInterface.methods.hit().send({ from: account });
        printReceipt("ScoreProxy", "hit", account, '', receipt);
        console.log('ScoreProxy score:' + await scoreInterface.methods.score().call({ from: account }));
    }

    // exit
    process.exit();
}
exec()
