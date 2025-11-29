# Roncate - Adaptive Educational Platform 🎓

Roncate is an advanced, AI-powered educational web application designed to optimize student performance through adaptive learning strategies. Unlike traditional note-taking apps, Roncate actively tracks syllabus completion, monitors study focus, and uses **Artificial Intelligence (Llama 3.1)** to generate personalized daily study plans.

![Roncate Banner](https://via.placeholder.com/1200x400.png?text=Roncate+Adaptive+Learning+Platform)

## 🚀 Key Features

### 1. 🧠 AI-Powered Study Coach
- **Model**: Powered by **Meta Llama 3.1** (via OpenRouter).
- **Adaptive Strategy**: Analyzes your incomplete syllabus topics and upcoming exam dates to generate a text-based strategy for the day.
- **Priority List**: Suggests specific topics to focus on immediately based on difficulty and urgency.

### 2. 🎯 Focus Mode & Distraction Fighter
A comprehensive system to ensure deep work sessions.
- **Custom Timer**: Set study duration (Countdown or Stopwatch).
- **Distraction Detection**: Automatically detects when you switch tabs, minimize the window, or lose focus.
- **Punishment System**:
  - **Audio Alert**: Plays a custom sound (`motivation.mp3`) or a TTS voice command ("Padh le! Exam hai teri!") when distracted.
  - **Time Penalty**: Adds +1 minute to your timer for every distraction.
  - **Blur Screen**: Temporarily blurs the interface to force a mental reset.
  - **Shame Counter**: Tracks and displays the total number of distractions in real-time.
- **Analytics**: visualizes study time vs. focus score.

### 3. 📋 Intelligent Syllabus Tracker
- **AI Parser**: Paste raw text from a PDF or course guide, and the AI will automatically extract topics and assign difficulty levels (Easy/Medium/Hard).
- **Manual Tracking**: Check off topics as you learn them to update your global progress.

### 4. 📝 Smart Notes Manager
- **Subject-wise Organization**: Keep notes separated by subject.
- **Rich Media**: Upload and attach images directly to your notes (stored as Base64 for portability).
- **Auto-Save**: Notes are saved locally or to the state instantly.

### 5. 📅 Exam Planner
- **Timeline Visualization**: See upcoming exams sorted by date.
- **Countdown**: Visual indicators for exams happening in the next 3 days.

### 6. 🔐 Role-Based Authentication
- **Firebase Auth**: Secure email/password login.
- **Student Profiles**:
  - **School Mode**: Tracks Class/Grade level.
  - **College Mode**: Tracks University, Branch/Major, and Year.

### 7. 🌗 UI/UX
- **Dark Mode**: Fully supported system-wide dark theme.
- **Responsive**: Works seamlessly on Desktop and Mobile.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: React Hooks & Context
- **Database & Auth**: Firebase (Firestore & Authentication)
- **Artificial Intelligence**: OpenRouter API (`meta-llama/llama-3.1-8b-instruct`)
- **Visualization**: Recharts (Data visualization for dashboard and focus stats)

---

## 📄 License

This project is licensed under the MIT License.