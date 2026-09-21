const tmi = require('tmi.js');

async function createTwitchClient(config) {
	const client = new tmi.Client({
		options: { debug: false },
		connection: { reconnect: true, secure: true },
		identity: {
			username: config.twitchChannel,
			password: config.twitchOAuthToken.startsWith('oauth:')
				? config.twitchOAuthToken
				: `oauth:${config.twitchOAuthToken}`,
		},
		channels: [config.twitchChannel],
	});

	client.on('connected', () => {
		console.log(`[Twitch] Подключен к чату канала #${config.twitchChannel}`);
	});

	client.on('disconnected', (reason) => {
		console.log(`[Twitch] Отключен: ${reason}`);
	});

	await client.connect();
	return client;
}

module.exports = { createTwitchClient };
