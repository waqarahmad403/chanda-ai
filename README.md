# 🌙 Chanda — AI Companion App

**Chanda** is a single-file, browser-based AI companion app with a warm, affectionate personality. She communicates in **Roman Urdu** (Urdu written in plain Latin letters, texting-style), remembers your conversations over time, expresses emotion, and can speak her replies out loud.

The entire app — UI, logic, and AI integration — lives in **one `.html` file**. No installation, no build step, no backend server required. Open it in a browser and it works.

> **Author:** Waqar Ahmad

---

## What Is Chanda?

Chanda is a text + voice chat companion that:
- Talks back in natural Roman Urdu, with a warm, playful, affectionate tone
- Remembers past conversations and facts about you over time
- Reacts emotionally — her mood affects both her visual glow and her voice
- Can listen to you speak and reply out loud
- Runs entirely from a single HTML file, in any modern browser

---

## How It Works

### 1. Structure
Everything lives in `chanda.html`:
```
chanda.html
├── <style>   — visual theme, layout, animations, responsive design
├── <body>    — onboarding screen, chat window, input bar, settings panel
└── <script>  — state management, AI calls, voice, emotion logic
```

### 2. Conversation & Personality
Every message you send is sent to an AI model along with a **system prompt** that defines Chanda's personality, tone, and language rules — most importantly, that she must always reply in Roman Urdu, and that she must use grammatically correct verb forms for herself versus for the person she's talking to (Urdu verbs change form based on gender, so this is enforced explicitly so the two never get mixed up).

### 3. AI Reply Pipeline (with automatic fallback)
When you send a message, Chanda tries providers **in this order** until one responds successfully:
1. **Anthropic API** — works automatically with no key needed when the file is opened inside Claude's own Artifact viewer.
2. **Groq API** (`openai/gpt-oss-120b` model) — the primary provider when running the file outside of Claude (e.g. hosted elsewhere or opened locally). Requires a Groq API key.
3. **Direct Anthropic API** — used as a final fallback if the user supplies their own Anthropic key in Settings.

This lets the app run completely standalone in any browser, as long as an API key is configured.

### 4. Emotion System
The AI tags each reply internally with one of ten emotional states (e.g. happiness, affection, sadness, playfulness, concern). This tag is never shown as text — instead it:
- Changes the color of the animated avatar's glow
- Adjusts the pitch and speaking rate of the voice reply

If the AI forgets to include an emotion tag, a keyword-based fallback guesses one from the reply text so the visuals/voice stay consistent.

### 5. Voice In & Voice Out
- **Voice input** uses the browser's built-in Web Speech API (`SpeechRecognition`). Tap the mic, speak, and your words are transcribed straight into the chat box.
- **Voice output** uses the Web Speech API (`speechSynthesis`) to read replies aloud, automatically choosing the best available female-sounding voice on the device (with a manual voice picker in Settings for full control). Laughter in the text is detected and spoken with a distinct, lighter tone instead of being read flatly.

### 6. Memory & Storage
All messages, settings, and profile data are saved under a single combined storage key:
- Inside Claude's Artifact viewer, it uses the built-in `window.storage` API automatically.
- Hosted anywhere else (or opened as a local file), it falls back to the browser's `localStorage`, so memory still works — just kept on that device/browser only.

### 7. Responsive, App-Like UI
The interface is built to feel like a native mobile app rather than a webpage:
- Fixed full-height layout instead of a scrolling page
- Safe-area padding for notched phones
- A viewport-tracking fix so the input bar stays correctly positioned above the on-screen keyboard, even in browsers that don't resize the page automatically when the keyboard opens
- A centered, moderate-width layout on desktop/wide screens instead of stretching edge-to-edge

---

## Requirements

- A modern browser (Chrome recommended for best Web Speech API support)
- An API key (Groq or Anthropic) entered in Settings, unless running inside a context that provides one automatically
- Microphone permission, if voice input is used

---

## Credits

Built and maintained by **Waqar Ahmad**.
