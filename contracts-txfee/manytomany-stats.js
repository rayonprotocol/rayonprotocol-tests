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
const exec = async () => {
    // account list
    const accounts = await web3_eth.getAccounts();
    const admin = accounts[0];
    // console.log(accounts);

    // deploy contracts
    // Student
    var [studentContract, receipt] = await deployContract("../../solidity-many-to-many-relationship/build/contracts/Student.json", admin);
    printReceipt("Student", "new", admin, '', receipt);
    // Course
    var [courseContract, receipt] = await deployContract("../../solidity-many-to-many-relationship/build/contracts/Course.json", admin);
    printReceipt("Course", "new", admin, '', receipt);
    // StudentCourse
    var [studentCourseContract, receipt] = await deployContract("../../solidity-many-to-many-relationship/build/contracts/StudentCourse.json", admin);
    printReceipt("StudentCourse", "new", admin, '', receipt);

    const studentNum = 10;
    const courseNum = 30;
    // const studentNum = 2;
    // const courseNum = 6;
    // Student - add
    var studentIds = [];
    for (i = 0; i < studentNum; i++) {
        const studentId = web3_eth.accounts.create().address;
        const name = randomString({ length: 10 + Math.floor(Math.random() * 10) });

        receipt = await studentContract.methods.add(studentId, name).send({ from: admin });
        printReceipt("Student", "add", admin, studentId + ',' + name, receipt);
        studentIds.push(studentId);
    }
    // Course - add
    var courseIds = [];
    for (i = 0; i < courseNum; i++) {
        const courseId = web3.utils.fromAscii('courseId' + i);
        const courseName = randomString({ length: 10 + Math.floor(Math.random() * 10) });
        const teacherId = web3_eth.accounts.create().address;
        const bookName = randomString({ length: 5 + Math.floor(Math.random() * 5) });

        receipt = await courseContract.methods.add(courseId, courseName, teacherId, bookName).send({ from: admin });
        printReceipt("Course", "add", admin, courseName + ',' + '...' + ',' + teacherId + ',' + bookName, receipt);
        courseIds.push(courseId);
    }
    // StudentCourse - connect
    for (i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        let courseIndex = 0;
        while (courseIndex < courseIds.length - 1) {
            const courseId = courseIds[courseIndex];

            receipt = await studentCourseContract.methods.connect(studentId, courseId).send({ from: admin });
            printReceipt("StudentCourse", "connect", admin, studentId + ',' + courseIndex, receipt);

            courseIndex += (1 + Math.floor(Math.random() * courseNum / 3));
        }
    }
    // StudentCourse - disconnect
    for (i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        const studentCourseCount = await studentCourseContract.methods.getConnectedCourseCount(studentId).call({ from: admin });
        for (j = 0; j < studentCourseCount; j++) {
            const courseId = await studentCourseContract.methods.getConnectedCourseId(studentId, j).call({ from: admin });

            receipt = await studentCourseContract.methods.disconnect(studentId, courseId).send({ from: admin });
            printReceipt("StudentCourse", "disconnect", admin, studentId + ',' + j, receipt);
        }
    }
    // Student - remove
    for (i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];

        receipt = await studentContract.methods.remove(studentId).send({ from: admin });
        printReceipt("Student", "remove", admin, studentId, receipt);
    }
    // Course - remove
    for (i = 0; i < courseIds.length; i++) {
        const courseId = courseIds[i];

        receipt = await courseContract.methods.remove(courseId).send({ from: admin });
        printReceipt("Course", "remove", admin, courseId, receipt);
    }


    // exit
    process.exit();
}
exec()
