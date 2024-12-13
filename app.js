// Import required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'insecure_secret', // Weak secret for demonstration
        resave: false,
        saveUninitialized: true,
    })
);

// Database setup
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');
    db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin123')");
    db.run("INSERT INTO users (username, password) VALUES ('user', 'user123')");
});

// Routes

// Home Route
app.get('/', (req, res) => {
    res.send(`
        <h1>OWASP Top 10 Vulnerabilities Demo</h1>
        <p>This application demonstrates common security vulnerabilities:</p>
        <ul>
            <li>A1 - Injection</li>
            <li>A2 - Broken Authentication and Session Management</li>
            <li>A3 - Cross-Site Scripting (XSS)</li>
            <li>A4 - Insecure Direct Object References</li>
            <li>A5 - Security Misconfiguration</li>
            <li>A6 - Sensitive Data Exposure</li>
            <li>A8 - Cross-Site Request Forgery (CSRF)</li>
            <li>A10 - Unvalidated Redirects and Forwards</li>
        </ul>
    `);
});

// A1 - Injection
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    db.get(query, (err, row) => {
        if (err) return res.send('Database error.');
        if (row) {
            req.session.user = row;
            return res.send('Login successful!');
        }
        res.send('Invalid username or password.');
    });
});

// A2 - Broken Authentication and Session Management
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.send('Not authenticated.');
    res.send(`Welcome ${req.session.user.username}`);
});

// A3 - Cross-Site Scripting (XSS)
app.post('/submit', (req, res) => {
    const { comment } = req.body;
    res.send(`Comment received: ${comment}`); // Reflecting user input directly
});

// A4 - Insecure Direct Object References
app.get('/user/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM users WHERE id = ${id}`, (err, row) => {
        if (err) return res.send('Database error.');
        if (row) return res.json(row);
        res.send('User not found.');
    });
});

// A5 - Security Misconfiguration
app.use('/admin', express.static('admin_files')); // Exposes sensitive admin files

// A6 - Sensitive Data Exposure
app.get('/download', (req, res) => {
    res.sendFile(__dirname + '/sensitive_file.txt'); // Exposing sensitive data file
});

// A8 - Cross-Site Request Forgery (CSRF)
app.post('/transfer', (req, res) => {
    if (!req.session.user) return res.send('Not authenticated.');
    const { amount, recipient } = req.body;
    res.send(`Transferred ${amount} to ${recipient}`); // No CSRF protection
});

// A10 - Unvalidated Redirects and Forwards
app.get('/redirect', (req, res) => {
    const { url } = req.query;
    res.redirect(url); // Unvalidated redirect
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});