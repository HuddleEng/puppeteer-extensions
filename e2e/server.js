const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'todomvc-react')));

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.listen(3000, () => {
    console.log(`Test server started on port 3000`);
});
