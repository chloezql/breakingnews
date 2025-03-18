import React from 'react';
import ReactDOM from 'react-dom/client';
import LeaderboardPage from './components/LeaderboardPage';
import './styles/index.scss';
import reportWebVitals from './reportWebVitals';

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <LeaderboardPage />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 