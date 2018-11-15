const Caver = require('caver-js');
const console = require('console');

var caver = new Caver('ws://192.168.3.102:8552');

const privateKey1 = '98d88baf868ed7f5b65e37753ef58b33119447ef56f1adc6b73127bd2bcaa219';
const address1 = '0x546352e8e80cd7aE489Ae8F6FFf088e4035446c5';
const privateKey2 = 'cc44f51a3935aa1d5c2f7b1cfc2b3d4903e57402413d1cb506a35a264bb8009f';
const address2 = '0x47590e57F74d3de66bD36230dE2dEc5c4e9E12f2';

const privateKey = privateKey2;
const fromAddress = address2;
const toAddress = address1;

caver.klay.getTransactionCount(fromAddress).then(nonce => {
    // console.log("Nonce: " + nonce.toString(16));

    var Tx = require('ethereumjs-tx');
    var rawTx = {
        nonce: caver.utils.toHex(nonce),
        gasPrice: caver.utils.toHex('25000000000'),
        gasLimit: caver.utils.toHex('20000000'),
        from: fromAddress,
        to: toAddress,
        value: caver.utils.toHex(caver.utils.toPeb('100', 'KLAY')),
    }

    var tx = new Tx(rawTx);
    tx.sign(new Buffer(privateKey, 'hex'));

    var serializedTx = tx.serialize();
    caver.klay.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('receipt', console.log)
        .catch(function (err) {
            console.log(err);
        });

    // // Not working
    // let txParams = {
    //     nonce: caver.utils.toHex(nonce),
    //     gasPrice: caver.utils.toHex('25000000000'),
    //     gasLimit: caver.utils.toHex('20000000'),
    //     from: fromAddress,
    //     to: toAddress,
    //     value: caver.utils.toHex(caver.utils.toPeb('3', 'KLAY')),
    //     chainId: 1000,
    // };

    // caver.klay.accounts.signTransaction(txParams, privateKey)
    //     .then(({ rawTransaction }) => {
    //         caver.klay.sendSignedTransaction(rawTransaction)
    //             .on('receipt', console.log)
    //             .catch(function (err) {
    //                 console.log(err);
    //             });
    //     });

});