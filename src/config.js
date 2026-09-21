const fs = require('fs');
const path = require('path');

// Когда собрано в exe через pkg, __dirname указывает внутрь "снапшота",
// поэтому все файлы конфигурации храним рядом с самим exe.
// В обычном (не-pkg) запуске — рядом с тем файлом, который реально запущен
// (это верно и для "node src/index.js", и для бандла в один файл).
const BASE_DIR = process.pkg
	? path.dirname(process.execPath)
	: path.dirname(require.main.filename);

const CONFIG_PATH = path.join(BASE_DIR, 'config.json');
const TOKENS_PATH = path.join(BASE_DIR, 'tokens.json');
const BANNED_WORDS_PATH = path.join(BASE_DIR, 'banned_words.txt');

function loadJson(filePath, fallback) {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (e) {
		return fallback;
	}
}

function saveJson(filePath, data) {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function loadConfig() {
	return loadJson(CONFIG_PATH, null);
}

function saveConfig(cfg) {
	saveJson(CONFIG_PATH, cfg);
}

function loadTokens() {
	return loadJson(TOKENS_PATH, null);
}

function saveTokens(tokens) {
	saveJson(TOKENS_PATH, tokens);
}

function ensureBannedWordsFile() {
	if (!fs.existsSync(BANNED_WORDS_PATH)) {
		const header = [
			'# Свой список запрещённых слов/фраз — по одному на строку.',
			'# Регистр не важен. Эти слова будут вырезаны (заменены на ***) из текста доната.',
			'# Строки, начинающиеся с #, игнорируются.',
			'# Базовый мат (рус/eng) фильтруется отдельной встроенной библиотекой автоматически —',
			'# сюда добавляйте то, что считаете нужным дополнительно (например, конкретные слова,',
			'# за которые бывают баны на Twitch, ссылки на сторонние стримы и т.п.).',
			'',
		].join('\n');
		fs.writeFileSync(BANNED_WORDS_PATH, header, 'utf8');
	}
}

function loadCustomBannedWords() {
	ensureBannedWordsFile();
	const lines = fs.readFileSync(BANNED_WORDS_PATH, 'utf8').split(/\r?\n/);
	return lines
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#'));
}

module.exports = {
	BASE_DIR,
	CONFIG_PATH,
	TOKENS_PATH,
	BANNED_WORDS_PATH,
	loadConfig,
	saveConfig,
	loadTokens,
	saveTokens,
	loadCustomBannedWords,
	ensureBannedWordsFile,
};
