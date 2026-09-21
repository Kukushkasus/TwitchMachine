const leoProfanity = require('leo-profanity');
const { loadCustomBannedWords } = require('./config');

leoProfanity.loadDictionary(); // английский словарь по умолчанию

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Создаёт функцию фильтрации текста доната. Асинхронная фабрика нужна,
 * т.к. russian-bad-word-censor — чисто ESM-пакет и грузится через dynamic import.
 *
 * Возвращаемая функция:
 * 1. Вырезает русский мат (с учётом замены букв типа "3"/"@") — russian-bad-word-censor
 * 2. Вырезает английский мат — leo-profanity
 * 3. Вырезает слова из собственного списка пользователя (banned_words.txt)
 *
 * Ничего не блокирует целиком — только заменяет плохие слова на ***,
 * чтобы сумма и ник доносились до чата в любом случае.
 */
async function createFilter() {
	const { RuCensor } = await import('russian-bad-word-censor');
	const ruCensor = new RuCensor('strict');

	return function filterDonationText(text) {
		if (!text) return '';

		let result = text;

		try {
			result = ruCensor.replace(result, '*');
		} catch (e) {
			// не роняем бота из-за фильтра
		}

		try {
			result = leoProfanity.clean(result);
		} catch (e) {
			// аналогично
		}

		const customWords = loadCustomBannedWords();
		for (const word of customWords) {
			if (!word) continue;
			const pattern = new RegExp(`(${escapeRegex(word)})`, 'giu');
			result = result.replace(pattern, (m) => '*'.repeat(m.length));
		}

		return result;
	};
}

/**
 * Twitch режет сообщения длиннее ~500 символов — подрежем на всякий случай.
 */
function clampForTwitch(text, maxLen = 480) {
	if (text.length <= maxLen) return text;
	return text.slice(0, maxLen - 1) + '…';
}

module.exports = { createFilter, clampForTwitch };
