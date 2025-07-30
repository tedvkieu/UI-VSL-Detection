# 🤟 VSL Translator – Vietnamese Sign Language to Text System

A multi-platform system that translates Vietnamese Sign Language (VSL) into real-time textual output using deep learning and websocket communication.  
This project includes:

- ✨ Machine learning core (LSTM-based prediction)
- 📱 Mobile app for real-time gesture capture
- 🌐 Web app for text display and control

---

## 🧩 Repositories

1. 🔬 **Core Prediction Engine**
   - 📂 [`vsl-core`]([https://github.com/yourusername/vsl-core](https://github.com/tedvkieu/Core-VSL-Detect))
   - Description: Python-based LSTM model for classifying hand gestures into text. Supports real-time inference and communication via WebSocket.
   
2. 📱 **Mobile Application**
   - 📂 [`vsl-mobile`]([https://github.com/yourusername/vsl-mobile](https://github.com/tedvkieu/VSL-App-Mobile))
   - Description: Built with React Native (Expo), this app captures user sign gestures via camera and streams them to the backend for prediction.

3. 💻 **Web Application**
   - 📂 [`vsl-web`]([https://github.com/yourusername/vsl-web](https://github.com/tedvkieu/UI-VSL-Detection))
   - Description: A modern web interface built with Next.js that connects to the WebSocket server and displays the translated text in real-time.

---

## 🚀 System Architecture

