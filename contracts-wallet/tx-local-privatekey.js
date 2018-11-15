const Web3 = require('web3'); // web 1.0.0
const console = require('console');

var web3 = new Web3('HTTP://127.0.0.1:8545');

const privateKey1 = '98d88baf868ed7f5b65e37753ef58b33119447ef56f1adc6b73127bd2bcaa219';
const address1 = '0x546352e8e80cd7aE489Ae8F6FFf088e4035446c5';
const privateKey2 = 'cc44f51a3935aa1d5c2f7b1cfc2b3d4903e57402413d1cb506a35a264bb8009f';
const address2 = '0x47590e57F74d3de66bD36230dE2dEc5c4e9E12f2';

const privateKey = privateKey2;
const fromAddress = address2;
const toAddress = address1;

web3.eth.getTransactionCount(fromAddress).then(nonce => {
    // console.log("Nonce: " + nonce.toString(16));

    var Tx = require('ethereumjs-tx');
    var rawTx = {
        nonce: web3.utils.numberToHex(nonce),
        gasPrice: web3.utils.numberToHex('1'),
        gasLimit: web3.utils.numberToHex('90000000000'),
        from: fromAddress,
        to: toAddress,
        value: web3.utils.numberToHex(web3.utils.toWei('1')),
    }

    var tx = new Tx(rawTx);
    tx.sign(new Buffer(privateKey, 'hex'));

    var serializedTx = tx.serialize();
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('receipt', console.log)
        .catch(function (err) {
            console.log(err);
        });

});