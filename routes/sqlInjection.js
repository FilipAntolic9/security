// /routes/sqlInjection.js
const express = require('express');
const { Client } = require('pg');
const router = express.Router();
const supabase = require('../supabaseClient');


const client = new Client({
    user: 'postgres.pkbbpailgyurmlabprxi',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    database: 'postgres',
    password: 'STjegsUeOSmN43TO',
    port: 6543,
});

client.connect();

let sqlInjectionEnabled = true;

router.get('/', (req, res) => {
    res.render('sqlInjection', { sqlInjectionEnabled });
});

router.post('/search', async (req, res) => {
    const { username, code } = req.body;
    let results = null;

    try {
        if (sqlInjectionEnabled) {
            // nesigurno
            const query = `
                SELECT id, username, firstname, lastname, email, phone 
                FROM accounts 
                WHERE username = '${username}' AND password = '${code}'
            `;
            const result = await client.query(query);
            results = result.rows;
        } else {
            // parametrizirani upit
            if (typeof username !== 'string' || typeof code !== 'string') {
                throw new Error("");
            }
            const { data, error } = await supabase
                .from('accounts')
                .select('id, username, firstname, lastname, email, phone')
                .eq('username', username)
                .eq('password', code);

            if (error) throw error;
            results = data;
        }

        res.render('sqlInjection', { results, sqlInjectionEnabled });
    } catch (error) {
        res.render('sqlInjection', { error: "Neispravan unos", sqlInjectionEnabled });
    }
});

router.post('/toggle-sql-injection', (req, res) => {
    sqlInjectionEnabled = !sqlInjectionEnabled;
    res.redirect('/sql-injection');
});

module.exports = router;
