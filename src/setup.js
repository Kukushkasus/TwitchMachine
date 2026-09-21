const readline = require('readline');
const { saveConfig } = require('./config');

function ask(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

async function runSetupWizard() {
	console.log('');
	console.log('=== Первая настройка донат-бота ===');
	console.log('');
	console.log('--- Twitch ---');
	console.log('Нужен OAuth-токен аккаунта, ОТ ИМЕНИ которого бот будет писать в чат.');
	console.log('Проще всего получить его на https://twitchtokengenerator.com/');
	console.log('  1) Выбрать "Bot Chat Token" (или Custom Scopes с chat:read + chat:edit)');
	console.log('  2) Войти под тем аккаунтом, от имени которого бот будет писать (например, самим стримером)');
	console.log('  3) Скопировать "ACCESS TOKEN" (он начинается с набора букв/цифр, БЕЗ "oauth:")');
	console.log('');
	const twitchChannel = await ask('Введи ник Twitch-канала (куда писать сообщения), например Kuku: ');
	let twitchOAuthToken = await ask('Вставь Twitch OAuth-токен: ');
	twitchOAuthToken = twitchOAuthToken.replace(/^oauth:/i, '').trim();

	console.log('');
	console.log('--- DonationAlerts ---');
	console.log('Нужно создать своё приложение на https://www.donationalerts.com/application/clients');
	console.log('  Redirect URI укажи ровно такой: http://localhost:8942/callback');
	console.log('  После создания скопируй Client ID и Client Secret.');
	console.log('');
	const daClientId = await ask('DonationAlerts Client ID: ');
	const daClientSecret = await ask('DonationAlerts Client Secret: ');

	console.log('');
	const messageTemplate = await ask(
		'Шаблон сообщения в чат (Enter — оставить стандартный)\n' +
			'Доступно: {user} {amount} {currency} {message}\n' +
			'Стандартный: "💰 {user} задонатил {amount} {currency}: {message}"\n> ',
	);

	const config = {
		twitchChannel: twitchChannel.replace(/^#/, '').toLowerCase(),
		twitchOAuthToken,
		daClientId,
		daClientSecret,
		daRedirectUri: 'http://localhost:8942/callback',
		messageTemplate: messageTemplate || '💰 {user} задонатил {amount} {currency}: {message}',
		skipEmptyMessageDonations: false,
	};

	saveConfig(config);
	console.log('');
	console.log('Настройки сохранены в config.json рядом с программой.');
	console.log('(Если что-то ввёл неправильно — просто открой config.json в блокноте и поправь,');
	console.log(' или удали файл и запусти программу заново для повторной настройки.)');
	console.log('');
	return config;
}

module.exports = { runSetupWizard, ask };
