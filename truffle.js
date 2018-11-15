const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privateKeys = ["98D88BAF868ED7F5B65E37753EF58B33119447EF56F1ADC6B73127BD2BCAA219"]; // private keys

module.exports = {
	migrations_directory: "./migrations",
	networks: {
		development: {
			host: "localhost",
			port: 8545,
			network_id: "*" // Match any network id
		},
		ropsten: {
			provider: () => {
				return new HDWalletProvider(privateKeys, "https://ropsten.infura.io/H1k68oRrrO6mYsa4jmnC")
			},
			network_id: "*",
			gas: 2000000,
			gasPrice: 10000000000
		},
		klaytn: {
			host: '192.168.3.102',
			port: 8551,
			network_id: '1000', // Aspen network id
			gas: 20000000, // transaction gas limit
			gasPrice: 25000000000, // gasPrice of Aspen is 25 Gpeb
		}
	}
};
