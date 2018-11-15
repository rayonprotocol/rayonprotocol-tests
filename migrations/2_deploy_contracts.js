// const Greeter = artifacts.require('./Greeter.sol');
// const EcRecover = artifacts.require('./EcRecover.sol');
const KeyValue = artifacts.require('./KeyValue.sol');

module.exports = function (deployer, network, accounts) {
  // deployer.deploy(Greeter);
  // deployer.deploy(EcRecover);
  deployer.deploy(KeyValue);
};
