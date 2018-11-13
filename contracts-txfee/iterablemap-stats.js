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
var randomBytes = require('random-bytes')
const exec = async () => {
    // admin list
    const accounts = await web3_eth.getAccounts();
    const admin = accounts[0];
    // console.log(accounts);

    // deploy contracts
    // AddressToBytes32IterableMap
    var [iterableMapContract, receipt] = await deployContract("../../solidity-iterable-mapping/build/contracts/AddressToBytes32IterableMap.json", [], admin);
    printReceipt("AddressToBytes32IterableMap", "new", admin, '', receipt);
    // AddressToBytes32Map
    var [mapContract, receipt] = await deployContract("../../solidity-iterable-mapping/build/contracts/AddressToBytes32Map.json", [], admin);
    printReceipt("AddressToBytes32Map", "new", admin, '', receipt);

    const keyNum = 5;
    // AddressToBytes32IterableMap - add
    var keys = [];
    for (i = 0; i < keyNum; i++) {
        const key = web3_eth.accounts.create().address;
        const value = web3.utils.fromAscii('value' + i);
        receipt = await iterableMapContract.methods.add(key, value).send({ from: admin });
        printReceipt("AddressToBytes32IterableMap", "add", admin, key + ',' + '...', receipt);
        keys.push(key);
    }
    // AddressToBytes32IterableMap - remove
    for (i = 0; i < 1; i++) {
        receipt = await iterableMapContract.methods.remove(keys[i]).send({ from: admin });
        printReceipt("AddressToBytes32IterableMap", "remove", admin, keys[i], receipt);
    }

    keys = [];
    // AddressToBytes32Map - add
    for (i = 0; i < keyNum; i++) {
        const key = web3_eth.accounts.create().address;
        const value = web3.utils.fromAscii('value' + i);
        receipt = await mapContract.methods.add(key, value).send({ from: admin });
        printReceipt("AddressToBytes32Map", "add", admin, key + ',' + '...', receipt);
        keys.push(key);
    }
    // AddressToBytes32Map - remove
    for (i = 0; i < keyNum; i++) {
        receipt = await mapContract.methods.remove(keys[i]).send({ from: admin });
        printReceipt("AddressToBytes32Map", "remove", admin, keys[i], receipt);
    }

    // tests with RayonProxy

    // deploy proxy contracts & create interface contracts
    // proxy for AddressToBytes32IterableMap
    var [iterableMapProxy, receipt] = await deployContract("../../rayonprotocol-kycsystem-prototype/build/contracts/Proxy.json", [iterableMapContract.options.address], admin);
    // var [iterableMapProxy, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/Proxy.json", [iterableMapContract.options.address], admin);
    printReceipt("AddressToBytes32IterableMapProxy", "new", admin, iterableMapContract.options.address, receipt);
    var iterableMapInterface = await createContract("../../solidity-iterable-mapping/build/contracts/AddressToBytes32IterableMap.json", iterableMapProxy.options.address);
    console.log('proxy:' + iterableMapProxy.options.address + ', interface:' + iterableMapInterface.options.address + ', logic:' + iterableMapContract.options.address);
    // proxy for AddressToBytes32Map
    var [mapProxy, receipt] = await deployContract("../../rayonprotocol-kycsystem-prototype/build/contracts/Proxy.json", [mapContract.options.address], admin);
    // var [mapProxy, receipt] = await deployContract("../../solidity-upgradable-contracts/build/contracts/Proxy.json", [mapContract.options.address], admin);
    printReceipt("AddressToBytes32MapProxy", "new", admin, mapContract.options.address, receipt);
    var mapInterface = await createContract("../../solidity-iterable-mapping/build/contracts/AddressToBytes32Map.json", mapProxy.options.address);
    console.log('proxy:' + mapProxy.options.address + ', interface:' + mapInterface.options.address + ', logic:' + mapContract.options.address);

    // AddressToBytes32IterableMapProxy - add
    var keys = [];
    for (i = 0; i < keyNum; i++) {
        const key = web3_eth.accounts.create().address;
        const value = web3.utils.fromAscii('value' + i);
        receipt = await iterableMapInterface.methods.add(key, value).send({ from: admin });
        printReceipt("AddressToBytes32IterableMapProxy", "add", admin, key + ',' + '...', receipt);
        keys.push(key);
    }
    // AddressToBytes32IterableMapProxy - remove
    for (i = 0; i < 1; i++) {
        receipt = await iterableMapInterface.methods.remove(keys[i]).send({ from: admin });
        printReceipt("AddressToBytes32IterableMapProxy", "remove", admin, keys[i], receipt);
    }

    keys = [];
    // AddressToBytes32MapProxy - add
    for (i = 0; i < keyNum; i++) {
        const key = web3_eth.accounts.create().address;
        const value = web3.utils.fromAscii('value' + i);
        receipt = await mapInterface.methods.add(key, value).send({ from: admin });
        printReceipt("AddressToBytes32MapProxy", "add", admin, key + ',' + '...', receipt);
        keys.push(key);
    }
    // AddressToBytes32MapProxy - remove
    for (i = 0; i < keys.length; i++) {
        receipt = await mapInterface.methods.remove(keys[i]).send({ from: admin });
        printReceipt("AddressToBytes32MapProxy", "remove", admin, keys[i], receipt);
    }

    // exit
    process.exit();
}
exec()
