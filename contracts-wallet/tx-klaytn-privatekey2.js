const Caver = require('caver-js');
const console = require('console');

var caver = new Caver('ws://192.168.3.102:8552');

const address1 = '0x546352e8e80cd7aE489Ae8F6FFf088e4035446c5';
const privateKey2 = '0x98dc373cffe2af3933f55a0628764be123951ee61764af59b1147e81e7b281d6';
const address2 = '0x1E970Fd741d0F0f2c26FF472772910042D871CEb';

const privateKey = privateKey2;
const fromAddress = address2;
const toAddress = address1;



caver.klay.accounts.wallet.add(privateKey);
console.log(caver.klay.accounts.wallet);
console.log(caver.klay.accounts.wallet[0].address);


caver.klay.sendTransaction({
    from: caver.klay.accounts.wallet[0].address,
    value: caver.utils.toHex(caver.utils.toPeb('1', 'KLAY')),
    to: toAddress,
    gas: caver.utils.toHex('25000000000')
}).on('receipt', console.log)
    .catch(function (err) {
        console.log(err);
    });
