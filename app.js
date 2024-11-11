const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const supabase = require('./supabaseClient');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));

// routes
app.use('/', require('./routes/index'));
app.use('/sql-injection', require('./routes/sqlInjection'));
app.use('/auth', require('./routes/auth'));

// 
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = { app };
