# Twitch Chat Donation Bot (DonationAlerts)

What this program does: as soon as a donation comes in through DonationAlerts,
the bot automatically posts a message in the Twitch chat like:

    💰 John donated 100 USD: thanks for the stream!

Profanity and bad words in the donation text are automatically censored with
`***` (both Russian and English), and you can also add your own words to the
`banned_words.txt` file.

Nothing to install — just a `.exe` file.

---

## What you'll need once, before the first run

### 1. Twitch token

The bot will post to chat on behalf of whichever account's token you provide
(in your case — the streamer's own account).

1. Open https://twitchtokengenerator.com/
2. Choose **Bot Chat Token** (or a Custom Scope Token with the
   `chat:read` and `chat:edit` scopes)
3. Log in with the Twitch account the bot should post as
4. Copy the **ACCESS TOKEN** (a string of letters/digits, WITHOUT the `oauth:`
   prefix — if it's there, no worries, the program strips it automatically)

### 2. DonationAlerts application

1. Open https://www.donationalerts.com/application/clients
2. Create a new application (any name works, e.g. "Chat Bot")
3. In the **Redirect URI** field, enter exactly this, unchanged:
   ```
   http://localhost:8942/callback
   ```
4. After creating it, copy the **Client ID** and **Client Secret**

---

## First run

1. Launch `donation-bot.exe`
2. The program will ask a few questions right in the window:
   - Twitch channel name
   - Twitch OAuth token (from step 1)
   - DonationAlerts Client ID and Client Secret (from step 2)
   - message template (just press Enter to keep the default)
3. A browser window will open — log in to DonationAlerts once and authorize
   the app. You can close the browser afterward.
4. Done — the bot is now running and listening for donations.

All settings are saved to `config.json` next to the exe — on future runs you
won't be asked again, and you won't need to log in through the browser again
either (the token refreshes automatically).

If you entered something wrong — open `config.json` in a text editor and fix
it, or delete the file and run the exe again.

**Keep this window open during the stream** (you can minimize it). To stop
the bot, just close the window.

---

## Word filter

- Russian and English profanity is censored automatically, nothing to
  configure (it also catches common obfuscation like "sh1t", "f*ck", etc.)
- The `banned_words.txt` file is your own list of extra words/phrases, one
  per line. For example, you can add specific words that get you banned on
  Twitch, or links to other services you don't want showing up in chat.
  Lines starting with `#` are comments and are ignored.
- A donation is never blocked entirely — the amount and username always get
  through; only the specific bad words in the message text are censored.

## Message template

`config.json` has a `messageTemplate` field. Available placeholders:

- `{user}` — donor's username
- `{amount}` — amount
- `{currency}` — currency
- `{message}` — donation text (already filtered)

Example:
```
"messageTemplate": "🎉 New donation from {user} — {amount} {currency}! Message: {message}"
```

---

## Common issues

- **Bot doesn't post to chat** — your Twitch token probably expired or is
  invalid. Get a new one from twitchtokengenerator.com, paste it into the
  `twitchOAuthToken` field in `config.json`, and restart.
- **DonationAlerts authorization error** — check that the Redirect URI in
  your application on donationalerts.com is set exactly to
  `http://localhost:8942/callback`, with no trailing slash and no "https".
- **Windows Defender/antivirus flags the exe** — this is a standard false
  positive for programs built with `pkg` (a Node.js-to-exe packager); it
  often flags this kind of self-extracting executable as suspicious just
  because of how it's built. You can add the file to your exclusions.

---

## Building from source
(A ready-made build is available in Releases)

You need Node.js installed.

```bash
npm install
npm run build
```

The finished `donation-bot.exe` will appear in the `build/` folder.

You can also build just the bundle (for development/debugging):

```bash
npm run bundle   # builds dist/bundle.js
npm start        # runs src/index.js directly, without building an exe
```

`config.json` and `tokens.json` are created automatically on first run and
are not tracked in the repository (see `.gitignore`) — they hold your
personal tokens. The word-list template lives in `banned_words.example.txt`;
on first run the program creates a working `banned_words.txt` next to the exe.
