const Web3 = require('web3'); // web 1.0.0
const Caver = require('caver-js');
const console = require('console');
// var Tx = require('ethereumjs-tx');

// Provider
const privateKey = '0x98dc373cffe2af3933f55a0628764be123951ee61764af59b1147e81e7b281d6';
const address = '0x1E970Fd741d0F0f2c26FF472772910042D871CEb';
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
    // case 'local':
    //     web3 = new Web3(networks[networkName].url);
    //     web3_eth = web3.eth;
    //     break;
    // case 'ropsten':
    //     web3 = new Web3(networks[networkName].url);
    //     web3_eth = web3.eth;
    //     break;
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
const deployContract = async (buildFilePath, args, sender, privateKey) => {
    const contractBuildJson = require(buildFilePath);
    const contract = new web3_eth.Contract(contractBuildJson.abi);
    const code = contract.deploy({
        data: contractBuildJson.bytecode,
        arguments: args
    }).encodeABI();

    var rawTx = {
        gas: web3.utils.numberToHex(gasPrice),
        from: sender,
        value: web3.utils.numberToHex('0'),
        data: code
    }
    var receipt = await web3_eth.sendTransaction(rawTx);

    return [receipt.contractAddress, receipt];
}

const put = async (contractAddress, key, value, sender, privateKey) => {
    const functionAbi = {
        "constant": false,
        "inputs": [
            {
                "name": "_key",
                "type": "uint32"
            },
            {
                "name": "_value",
                "type": "uint32"
            }
        ],
        "name": "put",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    };
    const functionCode = web3_eth.abi.encodeFunctionCall(functionAbi, [key, value]);

    var rawTx = {
        gas: web3.utils.numberToHex(gasPrice),
        from: sender,
        to: contractAddress,
        value: web3.utils.numberToHex('0'),
        data: functionCode
    }
    var receipt = await web3_eth.sendTransaction(rawTx);
    return receipt;
}
const get = async (contractAddress, key, sender) => {
    const functionAbi = {
        "constant": true,
        "inputs": [
            {
                "name": "_key",
                "type": "uint32"
            }
        ],
        "name": "get",
        "outputs": [
            {
                "name": "",
                "type": "uint32"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
    const functionCode = web3_eth.abi.encodeFunctionCall(functionAbi, [key]);

    const ret = await web3_eth.call({
        to: contractAddress,
        data: functionCode
    })

    return await web3_eth.abi.decodeParameters(functionAbi.inputs, ret)['0'];
}

var receiptCount = 0;
var gasAmount = 0;
const printReceipt = (contractName, method, sender, args, receipt) => {
    gasAmount += receipt.gasUsed;
    const txFee = receipt.gasUsed * networks['klaytn'].gasPrice / Math.pow(10, 18);
    const txFeeAmount = gasAmount * networks['klaytn'].gasPrice / Math.pow(10, 18);
    console.log(++receiptCount + '\t' + receipt.blockNumber + '\t' + contractName + '\t' + method + '\t' + sender + '\t' + args + '\t' + receipt.gasUsed + '\t' + gasAmount + '\t' + txFee + '\t' + txFeeAmount);
}

const exec = async () => {
    web3_eth.accounts.wallet.add(privateKey);
    // console.log(web3_eth.accounts.wallet);
    // console.log(web3_eth.accounts.wallet[0].address);

    var [contractAddress, receipt] = await deployContract('../build/contracts/KeyValue.json', [], address, privateKey);
    printReceipt("KeyValue", "new", address, '', receipt);
    // console.log(receipt);

    var key = 1;
    var value = 100;
    var receipt = await put(contractAddress, key, value, address, privateKey);
    printReceipt("KeyValue", "put", address, key + ',' + value, receipt);

    var key = 1;
    var value = await get(contractAddress, 1, address);
    console.log('Get: ' + key + ' => ' + value);

    // exit
    process.exit();
}
exec()
