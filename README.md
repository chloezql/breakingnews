# Breaking News - Interactive Investigation Game

An immersive journalism investigation game where you play as a reporter investigating the mysterious death of Erin Carter, a promising young artist found dead at AAA Academy. Interview suspects, gather evidence, and uncover the truth behind this tragic event.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd breaking-news
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the game:
```bash
npm start
```

The game will launch in your browser at `http://localhost:3000`

## 🎮 Game Features

- **Interactive Interviews**: Use voice or text to interview suspects and witnesses
- **Evidence Collection**: Gather and analyze crucial evidence
- **Strategic Questioning**: Choose your questions wisely - you only get 3 questions per suspect
- **Real-time AI Conversations**: Powered by OpenAI's advanced language models
- **Dynamic Story Progression**: Your choices influence the investigation

## 🎯 Gameplay Tips

- Each suspect can only be interviewed once with a maximum of 3 questions
- Pay attention to contradictions in suspect statements
- Take notes on important details
- Consider the relationships between different pieces of evidence

## 🔧 Troubleshooting

If you encounter issues:

1. Verify your OpenAI API key is correctly set in `.env`
2. Ensure all dependencies are installed (`npm install`)
3. Check that your browser's microphone permissions are enabled
4. Clear browser cache and reload if needed

## 🛠 Technical Requirements

- Modern web browser (Chrome, Firefox, Safari)
- Microphone access (for voice interactions)
- Stable internet connection
- Valid OpenAI API key with sufficient credits
