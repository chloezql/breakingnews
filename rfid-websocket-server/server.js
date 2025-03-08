// Save this as server.js
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors());  // Important for cross-machine requests
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
let lastCardId = null;

// WebSocket connection handler
wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(ws, clientId);

    console.log(`New client connected: ${clientId}`);

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`Received: ${message}`);

            if (data.type === 'rfid_scan') {
                // Store the card ID and forward to all React clients
                lastCardId = data.cardId;

                // Broadcast to all React clients
                clients.forEach((id, client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'rfid_scan',
                            cardId: data.cardId,
                            deviceId: data.deviceId,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
            } else if (data.type === 'device_connect') {
                console.log(`Device connected: ${data.deviceId} (${data.deviceType})`);

                // If it's a React client connecting, send the last card ID if available
                if (data.deviceType === 'react_client' && lastCardId) {
                    ws.send(JSON.stringify({
                        type: 'last_rfid_scan',
                        cardId: lastCardId,
                        timestamp: new Date().toISOString()
                    }));
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`Client disconnected: ${clients.get(ws)}`);
        clients.delete(ws);
    });
});

// Simple test endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        clients: clients.size,
        lastCardId: lastCardId
    });
});

// Get your local IP address to share with other devices
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const getLocalIP = () => {
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            // Skip internal and non-IPv4 addresses
            if (!iface.internal && iface.family === 'IPv4') {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local Address: http://localhost:${PORT}`);
    console.log(`Network Address: http://${localIP}:${PORT}`);
    console.log(`WebSocket URL: ws://${localIP}:${PORT}`);
});