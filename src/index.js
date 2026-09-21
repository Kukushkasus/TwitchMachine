const { ApiClient } = require('@donation-alerts/api');
const { UserEventsClient } = require('@donation-alerts/events');

const { loadConfig, ensureBannedWordsFile } = require('./config');
const { runSetupWizard } = require('./setup');
const { getAuthProvider } = require('./daAuth');
const { createFilter, clampForTwitch } = require('./filter');
const { createTwitchClient } = require('./twitchBot');

function formatMessage(template, data) {
	return template
		.replace(/\{user\}/g, data.user)
		.replace(/\{amount\}/g, data.amount)
		.replace(/\{currency\}/g, data.currency)
		.replace(/\{message\}/g, data.message);
}

async function main() {
	console.log('=== Донат-бот для Twitch-чата (DonationAlerts) ===');

	ensureBannedWordsFile();

	let config = loadConfig();
	if (!config) {
		config = await runSetupWizard();
	}

	console.log('Загружаю фильтр нежелательных слов...');
	const filterText = await createFilter();

	console.log('Авторизуюсь в DonationAlerts...');
	const { authProvider, userId } = await getAuthProvider(config);

	const apiClient = new ApiClient({ authProvider });
	const userEventsClient = new UserEventsClient({ user: userId, apiClient });

	userEventsClient.onConnect(() => {
		console.log('[DonationAlerts] Подключен, жду донаты...');
	});
	userEventsClient.onDisconnect((reason, willReconnect) => {
		console.log(`[DonationAlerts] Отключен: ${reason}. Переподключение: ${willReconnect}`);
	});

	console.log('Подключаюсь к чату Twitch...');
	const twitchClient = await createTwitchClient(config);

	userEventsClient.onDonation((evt) => {
		try {
			if (config.skipEmptyMessageDonations && !evt.message) return;

			const cleanMessage = filterText(evt.message || '');
			const text = formatMessage(config.messageTemplate, {
				user: evt.username || 'Аноним',
				amount: evt.amount,
				currency: evt.currency,
				message: cleanMessage,
			});

			const finalText = clampForTwitch(text);
			console.log(`[Донат] ${finalText}`);
			twitchClient.say(config.twitchChannel, finalText).catch((err) => {
				console.error('Не удалось отправить сообщение в чат:', err.message || err);
			});
		} catch (err) {
			console.error('Ошибка при обработке доната:', err);
		}
	});

	console.log('');
	console.log('Всё готово! Бот работает. Не закрывай это окно во время стрима.');
	console.log('Чтобы остановить — закрой окно или нажми Ctrl+C.');
	console.log('');
}

main().catch((err) => {
	console.error('');
	console.error('Произошла критическая ошибка:', err && err.message ? err.message : err);
	console.error('');
	console.error('Нажми Enter, чтобы закрыть окно...');
	process.stdin.resume();
	process.stdin.once('data', () => process.exit(1));
});
