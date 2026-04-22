# 🎮 Subuzlai — Pixel Platformer Game

Subuzlai is a pixel-art 2D platformer built with **Next.js, React, TypeScript, and HTML Canvas**.

Fight enemies, unlock levels, collect coins, and defeat the final boss in a retro-style experience with modern web technologies.


<img width="538" height="322" alt="ezgif com-crop" src="https://github.com/user-attachments/assets/e7ef3146-7922-4b14-9d7f-ffd1d8910fd0" />
<img width="534" height="323" alt="30bef97b-b803-4a11-893e-545c70a53b0a1-ezgif com-crop" src="https://github.com/user-attachments/assets/e1d11d53-f8c3-46e8-9ab2-60b872ef62b1" />





---

## ✨ Features

* 🕹️ Smooth 2D platformer gameplay
* 🔓 Progressive level unlocking system
* 👾 Enemies, traps, and boss fight
* 🛡️ Shield ability in boss level
* 💾 Auto-save progress with localStorage
* 🎬 Intro dialogues & ending credits
* 🎉 Pixel confetti win animation
* ⏸️ Pause / Restart / Level Select system
* 🎧 Pixel-style sound effects (Web Audio API)
* 🌄 Parallax background system

---

## 🎮 Controls

| Key         | Action                   |
| ----------- | ------------------------ |
| ← / →       | Move                     |
| ↑ / Space   | Jump                     |
| Q           | Shoot                    |
| C           | Shield (boss level only) |
| R           | Restart level            |
| ESC / Pause | Pause / Resume           |

---

## 🚀 Getting Started

Run the development server:

```
npm run dev
```

Open in your browser:

[http://localhost:3000](http://localhost:3000)

---

## 🧠 Gameplay

* Start from **Level 1**
* Complete levels to unlock the next ones
* Avoid traps and defeat enemies
* Collect coins and survive
* Final level = **Boss Fight**
* Win → Ending credits 🎬

---

## 🛠️ Tech Stack

* ⚡ Next.js — App structure & deployment
* ⚛️ React — UI & game state management
* 🟦 TypeScript — Type safety
* 🎨 HTML Canvas — Game rendering
* 💾 LocalStorage — Progress saving
* 🔊 Web Audio API — Sound effects

---

## 📁 Project Structure

```
src/app
├── game
│   ├── engine
│   ├── render
│   ├── PlatformerGame.tsx
│   └── audio.ts
├── ui
├── levels.json
└── page.tsx
```

---

## 💾 Save System

Progress is stored in the browser using `localStorage`.

Levels unlock automatically after completion.

---

## ⚠️ Important Note

File paths are **case-sensitive in production**.

✔️ Correct:

```
/Cat.png
/Red/Idle.png
```

❌ Wrong:

```
/cat.png
/red/idle.png
```

---

## 🌍 Deployment

Deploy easily with Vercel:

```
npm run build
```

---

## 🧪 Future Improvements

* 📱 Mobile controls
* 🎵 Background music
* 👾 More enemies & levels
* 🎮 Controller support
* ⚙️ Settings menu
* 🌐 Leaderboard

---

## 👨‍💻 Author

**Anas Bounaim**

* GitHub: [https://github.com/anasbounaiim](https://github.com/anasbounaiim)
* LinkedIn: [https://www.linkedin.com/in/anas-bounaim-37450621a/](https://www.linkedin.com/in/anas-bounaim-37450621a/)

---

## 😄 Fun Footer

© 2026 ANAS BOUNAIM — POWERED BY BUGS & ANIME ENERGY ⚡

---
