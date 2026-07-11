# FocusFlow — Mindful Task & Gamified Deadline Tracker

FocusFlow is a premium, modern, responsive single-page client-side web application designed to help you segregate, track, and complete your tasks with positive reinforcement. It is fully compatible with cell phones and tablets, adjusting dynamically to provide a native mobile app feel. It operates entirely in the browser, storing your tasks, custom categories (aspects), and user stats locally in the browser's `localStorage`.

---

## 🌟 Key Features

1. **Aspect Segregation**: Categorize your tasks into custom life aspects (e.g. *Life*, *Health*, *Work*, *Personal Development*, *Wife*). Set custom colors and emoji identifiers.
2. **Double-tier Deadline Tracking**:
   - Assign main deadlines to tasks.
   - Assign unique individual deadlines to subtasks.
   - Real-time ticking countdowns (seconds, minutes, days) directly on task cards.
   - Color-coded alerts (🟢 Safe, 🟡 Due Soon (<24h), 🔴 Overdue).
3. **Gamified Motivation**:
   - **XP System**: Earn 10 XP per subtask, 50 XP per main task, and 20 XP bonus for beating a deadline.
   - **Streak Counter**: Track consecutive days of active task completions. Fire badge 🔥 scales and flickers as streak increases.
   - **Why Statement**: Keep your underlying purpose visible. Every task displays a customizable "Why am I doing this?" phrase.
   - **Aspect-focused Quotes**: A curated quote engine that displays motivation based on the specific aspect of life you are focusing on.
4. **Focus Space (Pomodoro)**:
   - Run customizable focus (25m), short break (5m), and long break (15m) sessions.
   - Real-time audio synthesizer using the **Web Audio API** (rain, waves, wind, white noise) with no external audio file dependencies.
   - Earn 30 XP for successfully completing a focus session.
5. **Web Notifications**: Requests browser-native notification permissions to alert you when tasks or subtasks are within 1 hour of their deadlines.

---

## 📁 File Structure

- `index.html`: Contains the core page layout, navigation sidebar, dashboard, focus space, aspect manager, and modal dialogs.
- `styles.css`: Fully customized styling utilizing a modern, premium dark glassmorphism aesthetic, responsive grids, and micro-interactions.
- `app.js`: Application logic containing state managers, notification timers, gamified math, local storage syncing, and the Web Audio ambient sound synthesizer.

---

## 🚀 Quick Start

1. Open your browser and drag the `index.html` file into it, or open it directly:
   `file:///C:/Users/Jion/.gemini/antigravity/scratch/focusflow/index.html`
2. Grant permission for Web Notifications when prompted to enable real-time desktop reminders.
3. Manage your custom aspects in the **Aspects** tab.
4. Add tasks, track subtasks, and gain levels as you complete your goals!
