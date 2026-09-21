const http = require('http');
const { URL } = require('url');
const { execSync, exec } = require('child_process');
const { RefreshingAuthProvider } = require('@donation-alerts/auth');
const { loadTokens, saveTokens } = require('./config');

const SCOPES = ['oauth-user-show', 'oauth-donation-subscribe', 'oauth-donation-index'];

function openInBrowser(url) {
	try {
		if (process.platform === 'win32') {
			exec(`start "" "${url}"`);
		} else if (process.platform === 'darwin') {
			exec(`open "${url}"`);
		} else {
			exec(`xdg-open "${url}"`);
		}
	} catch (e) {
		// не критично — просто выведем ссылку в консоль
	}
}

function waitForAuthCode(redirectUri) {
	const url = new URL(redirectUri);
	const port = Number(url.port || 80);
	const callbackPath = url.pathname;

	return new Promise((resolve, reject) => {
		const server = http.createServer((req, res) => {
			const reqUrl = new URL(req.url, `http://${req.headers.host}`);
			if (reqUrl.pathname !== callbackPath) {
				res.writeHead(404);
				res.end();
				return;
			}
			const code = reqUrl.searchParams.get('code');
			const error = reqUrl.searchParams.get('error');
			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
			if (code) {
				res.end('<h2>Готово! Можно закрыть эту вкладку и вернуться в программу.</h2>');
			} else {
				res.end(`<h2>Ошибка авторизации: ${error || 'неизвестно'}</h2>`);
			}
			server.close();
			if (code) resolve(code);
			else reject(new Error('DonationAlerts не вернул код авторизации: ' + error));
		});
		server.listen(port, () => {});
		server.on('error', reject);
	});
}

/**
 * Создаёт AuthProvider. При первом запуске проводит пользователя через OAuth
 * в браузере и сохраняет refresh-токен в tokens.json. При последующих запусках
 * тихо переиспользует сохранённый токен (с авто-обновлением).
 */
async function getAuthProvider(config) {
	const authProvider = new RefreshingAuthProvider({
		clientId: config.daClientId,
		clientSecret: config.daClientSecret,
		redirectUri: config.daRedirectUri,
		scopes: SCOPES,
	});

	authProvider.onRefresh((userId, token) => {
		saveTokens({ userId, ...token });
	});

	const saved = loadTokens();
	if (saved && saved.refreshToken) {
		console.log('Использую сохранённую авторизацию DonationAlerts...');
		await authProvider.addUser(saved.userId, {
			accessToken: saved.accessToken,
			refreshToken: saved.refreshToken,
			expiresIn: saved.expiresIn || 0,
			obtainmentTimestamp: saved.obtainmentTimestamp || 0,
			scopes: SCOPES,
		});
		return { authProvider, userId: saved.userId };
	}

	// Первая авторизация — ведём пользователя через браузер
	const authorizeUrl =
		'https://www.donationalerts.com/oauth/authorize' +
		`?client_id=${encodeURIComponent(config.daClientId)}` +
		`&redirect_uri=${encodeURIComponent(config.daRedirectUri)}` +
		'&response_type=code' +
		`&scope=${encodeURIComponent(SCOPES.join(' '))}`;

	console.log('');
	console.log('Нужно один раз авторизовать DonationAlerts. Сейчас откроется браузер.');
	console.log('Если не открылся сам — перейди по ссылке вручную:');
	console.log(authorizeUrl);
	console.log('');

	const codePromise = waitForAuthCode(config.daRedirectUri);
	openInBrowser(authorizeUrl);
	const code = await codePromise;

	const tokenWithUserId = await authProvider.addUserForCode(code, SCOPES);
	saveTokens({ userId: tokenWithUserId.userId, ...tokenWithUserId });
	console.log('Авторизация DonationAlerts прошла успешно!');
	return { authProvider, userId: tokenWithUserId.userId };
}

module.exports = { getAuthProvider, SCOPES };
