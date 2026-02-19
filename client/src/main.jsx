import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#1A1D27',
                        color: '#E8EAED',
                        border: '1px solid #2E3350',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                    },
                    success: { iconTheme: { primary: '#4CAF50', secondary: '#0F1117' } },
                    error: { iconTheme: { primary: '#FF4C4C', secondary: '#0F1117' } },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>
);
