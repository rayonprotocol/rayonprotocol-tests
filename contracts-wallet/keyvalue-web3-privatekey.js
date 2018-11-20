const Web3 = require('web3'); // web 1.0.0
const Caver = require('caver-js');
const console = require('console');

// Provider
const privateKey = '98d88baf868ed7f5b65e37753ef58b33119447ef56f1adc6b73127bd2bcaa219';
const address = '0x546352e8e80cd7aE489Ae8F6FFf088e4035446c5';
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
switch (networkName) {
    case 'local':
        web3 = new Web3(networks[networkName].url);
        web3_eth = web3.eth;
        web3_eth.accounts.wallet.add('0x' + privateKey);
        break;
    case 'ropsten':
        web3 = new Web3(networks[networkName].url);
        web3_eth = web3.eth;
        break;
    case 'klaytn':
        web3 = new Caver(networks[networkName].url);
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
var randomString = require('random-string')

const runTest = async (admin, keyValueContract) => {
    // KeyValue - put
    const keyNum = 3;
    var keys = [];
    for (i = 0; i < keyNum; i++) {
        const key = i + 1;
        const value = key * 100;

        receipt = await keyValueContract.methods.put(key, value).send({ from: admin });
        printReceipt("KeyValue", "put", admin, key + ',' + value, receipt);
        keys.push(key);
    }
    // KeyValue - get
    for (i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = await keyValueContract.methods.get(key).call({ from: admin });
        console.log('Get: ' + key + ' => ' + value);
    }
}

const exec = async () => {
    // account list
    web3_eth.accounts.wallet.add('0x' + privateKey);
    const admin = web3_eth.accounts.wallet[0].address;
    // console.log(web3_eth.accounts.wallet);
    // console.log(admin);

    // deploy contracts
    // KeyValue
    var [keyValueContract, receipt] = await deployContract("../build/contracts/KeyValue.json", [], admin);
    printReceipt("KeyValue", "new", admin, '', receipt);

    // test1 - contracts
    await runTest(admin, keyValueContract);

    // exit
    process.exit();
}
exec()
