// backend/src/server.js
const app = require('./app');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
