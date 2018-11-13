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
var web3_eth;
var provider;
switch (networkName) {
    case 'local':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3_eth = (new Web3(provider)).eth;
        break;
    case 'ropsten':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3_eth = (new Web3(provider)).eth;
        break;
    case 'klaytn':
        provider = new HDWalletProvider(mnemonic, networks[networkName].url, 0, 10); // address_index=0, num_addresses=10
        web3_eth = (new Caver(provider)).klay;
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

const deployContract = async (buildFilePath, sender) => {
    const contractBuildJson = require(buildFilePath);
    // logContractBuild(contractBuildJson);

    const contract = new web3_eth.Contract(contractBuildJson.abi);
    contract.options.gasPrice = gasPrice;
    contract.options.gas = gasLimit;

    const deployMethod = contract.deploy({
        data: contractBuildJson.bytecode,
        arguments: [1]
    });

    // console.log('estimatedGas: ' + await deployMethod.estimateGas());    // estimate gas

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
    console.log(++receiptCount + '\t' + receipt.blockNumber + '\t' + contractName + '\t' + method + '\t' + sender + '\t' + args + '\t' + receipt.gasUsed + '\t' + gasAmount + '\t' + (receipt.gasUsed * gasPrice / Math.pow(10, 18)) + '\t' + (gasAmount * gasPrice / Math.pow(10, 18)));
}


// main test
const exec = async () => {
    // account list
    const accounts = await web3_eth.getAccounts();
    const admin = accounts[0];
    // console.log(accounts);

    // deploy contracts
    // BorrowerApp
    var [borrowerAppContract, receipt] = await deployContract("../../rayonprotocol-contract-borrower/build/contracts/BorrowerApp.json", admin);
    printReceipt("BorrowerApp", "new", admin, '', receipt);
    // Borrower
    var [borrowerContract, receipt] = await deployContract("../../rayonprotocol-contract-borrower/build/contracts/Borrower.json", admin);
    printReceipt("Borrower", "new", admin, '', receipt);
    receipt = await borrowerContract.methods.setBorrowerAppContractAddress(borrowerAppContract.options.address).send({ from: admin });
    printReceipt("Borrower", "setBorrowerAppContractAddress", admin, borrowerAppContract.options.address, receipt);
    // BorrowerMember
    var [borrowerMemberContract, receipt] = await deployContract("../../rayonprotocol-contract-borrower/build/contracts/BorrowerMember.json", admin);
    printReceipt("BorrowerMember", "new", admin, '', receipt);
    receipt = await borrowerMemberContract.methods.setBorrowerAppContractAddress(borrowerAppContract.options.address).send({ from: admin });
    printReceipt("BorrowerMember", "setBorrowerAppContractAddress", admin, borrowerAppContract.options.address, receipt);
    receipt = await borrowerMemberContract.methods.setBorrowerContractAddress(borrowerContract.options.address).send({ from: admin });
    printReceipt("BorrowerMember", "setBorrowerContractAddress", admin, borrowerContract.options.address, receipt);


    const numBorrowerApp = 10;
    const numBorrower = 30000;
    const numBorrowerPerApp = [1000, 12000, 2000, 3000, 1000, 1000, 3000, 5000, 1000, 1000];
    // const numBorrowerApp = 3;
    // const numBorrower = 15;
    // const numBorrowerPerApp = [1, 12, 2];
    // add BorrowerApp
    for (i = 0; i < numBorrowerApp; i++) {
        receipt = await borrowerAppContract.methods.add(accounts[i], 'BorrowerApp' + i).send({ from: admin });
        printReceipt("BorrowerApp", "add", admin, '' + accounts[i] + ',' + 'BorrowerApp' + i, receipt);
    }
    // update BorrowerApp
    for (i = 0; i < numBorrowerApp; i++) {
        receipt = await borrowerAppContract.methods.update(accounts[i], 'App' + i).send({ from: admin });
        printReceipt("BorrowerApp", "update", admin, '' + accounts[i] + ',' + 'App' + i, receipt);
    }

    // add Borrower
    var borrowers = [];
    for (i = 0; i < numBorrowerApp; i++) {
        for (j = 0; j < (numBorrower / numBorrowerApp); j++) {
            const borrowerAccount = web3_eth.accounts.create();
            receipt = await borrowerContract.methods.addWithNoAuth(borrowerAccount.address).send({ from: accounts[i] });
            printReceipt("Borrower", "addWithNoAuth", accounts[i], borrowerAccount.address, receipt);
            borrowers.push(borrowerAccount.address);
        }
    }
    // // add Borrower with verification
    // const signature = {
    //     messageHash: "0xc2db1ebc487a4aed2d04b1ed92cf8d5243257f6fdb04a575dfcbe9d1807b0fc7",
    //     v: 27,
    //     r: "0x50a712d83d00730c679368bdd4cebc21273d510cef47772ff972399d582bc096",
    //     s: "0x703ec857592a945d7a9288f43fd6f65f3ad4f9427b3b21274b52a3f1f2b88b37"
    // }
    // for (i = 0; i < numBorrowerApp; i++) {
    //     for (j = 0; j < (numBorrower / numBorrowerApp); j++) {
    //         const borrowerAccount = web3_eth.accounts.create();
    //         receipt = await borrowerContract.methods.addWithVerification(borrowerAccount.address, signature.messageHash, signature.v, signature.r, signature.s).send({ from: accounts[i] });
    //         printReceipt("Borrower", "addWithVerification", accounts[i], borrowerAccount.address + ', ...', receipt);
    //         borrowers.push(borrowerAccount.address);
    //     }
    // }

    // join Borrower to BorrowerApp
    var indexBorrowers = 0;
    for (i = 0; i < numBorrowerApp; i++) {
        for (j = 0; j < numBorrowerPerApp[i]; j++) {
            const borrowerAddress = borrowers[indexBorrowers++];
            receipt = await borrowerMemberContract.methods.joinWithNoAuth(borrowerAddress).send({ from: accounts[i] });
            printReceipt("BorrowerMember", "joinWithNoAuth", accounts[i], borrowerAddress, receipt);
        }
    }


    // var borrowerContract = await createContract("../../rayonprotocol-contract-borrower/build/contracts/Borrower.json", '0x7203e84b77dbef98041418e18e7b6c1df992d202');
    // console.log(await borrowerContract.methods.size().call({ from: admin }));



    // exit
    process.exit();
}
exec()
