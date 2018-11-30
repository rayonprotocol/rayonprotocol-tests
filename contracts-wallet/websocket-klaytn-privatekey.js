const Caver = require('caver-js');

var caver = new Caver('ws://192.168.3.102:8552'); // klaytn node ip : 192.168.3.102
// var caver = new Caver('http://192.168.3.102:8551');

const privateKey = '0xf7cd72178207e94255c394f9fc1fc6387f6b6eb3776701fc6ec76c5429030fe9';
caver.klay.accounts.wallet.add(privateKey);
const sender = caver.klay.accounts.wallet[0].address;

const contractBuildJson = require('../build/contracts/KeyValue.json');
const contract = new caver.klay.Contract(contractBuildJson.abi);
contract.options.gasPrice = '25000000000';
contract.options.gas = 20000000;

const deployMethod = contract.deploy({
    data: contractBuildJson.bytecode,
    arguments: []
});

// deploy contract
deployMethod.send({ from: sender }).on('receipt', function (receipt) {
    console.log(receipt);
});