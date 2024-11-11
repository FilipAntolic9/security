const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const supabase = require('../supabaseClient');
const session = require('express-session');

let authVulnerabilityEnabled = true;


function getSessionCookieSettings() {
    return {
        secure: !authVulnerabilityEnabled,
        httpOnly: !authVulnerabilityEnabled,
        maxAge: authVulnerabilityEnabled
            ? 30000 * 24 * 60 * 60 * 1000  // 30000d
            : 60 * 60 * 1000  // 1h
    };
}

router.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

function generateSessionId() {
    return authVulnerabilityEnabled
        ? `${new Date().getTime()}`
        : crypto.randomBytes(16).toString('hex');
}

router.post('/toggle-auth-vuln', (req, res) => {
    authVulnerabilityEnabled = !authVulnerabilityEnabled;
    console.log(`Auth vulnerability enabled: ${authVulnerabilityEnabled}`);

    //
    const currentCookieSettings = getSessionCookieSettings();
    console.log("Updated cookie settings after toggle:", currentCookieSettings);

    res.redirect('/auth/login');
});

router.get('/login', (req, res) => {
    res.render('login', { authVulnerabilityEnabled });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, password_hash')
            .eq('username', username)
            .single();

        if (userError && authVulnerabilityEnabled) {
            return res.render('login', { error: "Korisničko ime nije pronađeno", authVulnerabilityEnabled });
        }

        const { data: attemptsData, error: attemptsError } = await supabase
            .from('login_attempts')
            .select('attempt_count')
            .eq('username', username)
            .single();

        let attemptCount = attemptsData ? attemptsData.attempt_count : 0;

        if (authVulnerabilityEnabled) {
            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.render('login', { error: user ? "Neispravna lozinka" : "Korisničko ime nije pronađeno", authVulnerabilityEnabled });
            }

            req.session.sessionId = generateSessionId();
            req.session.user = user.username;

            req.session.cookie = getSessionCookieSettings();
            console.log("Cookie settings after login (insecure mode):", req.session.cookie);
            return res.redirect(`/auth/dashboard?sessionId=${req.session.sessionId}`);
        }

        if (attemptCount >= 10) {
            return res.render('login', { error: "Previše neuspjelih pokušaja prijave. Obratite se administratoru.", authVulnerabilityEnabled });
        } else if (attemptCount >= 5) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            if (attemptsData) {
                await supabase
                    .from('login_attempts')
                    .update({ attempt_count: attemptCount + 1, last_attempt: new Date() })
                    .eq('username', username);
            } else {
                await supabase
                    .from('login_attempts')
                    .insert({ username, attempt_count: 1, last_attempt: new Date() });
            }

            return res.render('login', { error: "Prijava nije uspjela", authVulnerabilityEnabled });
        }

        await supabase.from('login_attempts').update({ attempt_count: 0 }).eq('username', username);

        req.session.sessionId = generateSessionId();
        req.session.user = user.username;

        req.session.cookie = getSessionCookieSettings();
        console.log("Cookie settings after login (secure mode):", req.session.cookie);
        res.redirect('/auth/dashboard');
    } catch (error) {
        res.render('login', { error: "Došlo je do pogreške", authVulnerabilityEnabled });
    }
});

router.post('/logout', (req, res) => {
    if (authVulnerabilityEnabled) {
        res.redirect('/auth/login');
    } else {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('/auth/dashboard');
            }
            res.clearCookie('connect.sid');
            res.redirect('/auth/login');
        });
    }
});

router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('dashboard', { user: req.session.user });
});

module.exports = router;







// // /routes/auth.js
// const express = require('express');
// const bcrypt = require('bcrypt');
// const crypto = require('crypto');
// const router = express.Router();
// const supabase = require('../supabaseClient');
// const session = require('express-session');

// let authVulnerabilityEnabled = true;

// function getSessionCookieSettings() {
//     return {
//         secure: !authVulnerabilityEnabled,
//         httpOnly: !authVulnerabilityEnabled,
//         maxAge: authVulnerabilityEnabled
//             ? 30000 * 24 * 60 * 60 * 1000 // 30000d
//             : 60 * 60 * 1000 // 1h
//     };
// }

// // router.use(session({
// //     secret: 'replace_this_with_a_secure_secret',
// //     resave: false,
// //     saveUninitialized: true,
// //     cookie: {
// //         secure: !authVulnerabilityEnabled,
// //         httpOnly: !authVulnerabilityEnabled,
// //         maxAge: authVulnerabilityEnabled
// //             ? 30000 * 24 * 60 * 60 * 1000 // 30000d
// //             : 60 * 60 * 1000 // 1h
// //     }
// // }));


// function generateSessionId() {
//     return authVulnerabilityEnabled
//         ? `${new Date().getTime()}`
//         : crypto.randomBytes(16).toString('hex');
// }

// router.use(session({
//     secret: 'secret',
//     resave: false,
//     saveUninitialized: true,
//     cookie: getSessionCookieSettings()
// }));

// router.post('/toggle-auth-vuln', (req, res) => {
//     authVulnerabilityEnabled = !authVulnerabilityEnabled;
//     res.redirect('/auth/login');
// });

// router.get('/login', (req, res) => {
//     res.render('login', { authVulnerabilityEnabled });
// });

// router.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const { data: user, error: userError } = await supabase
//             .from('users')
//             .select('id, username, password_hash')
//             .eq('username', username)
//             .single();

//         if (userError && authVulnerabilityEnabled) {
//             return res.render('login', { error: "Korisničko ime nije pronađeno", authVulnerabilityEnabled });
//         }

//         const { data: attemptsData, error: attemptsError } = await supabase
//             .from('login_attempts')
//             .select('attempt_count')
//             .eq('username', username)
//             .single();

//         let attemptCount = attemptsData ? attemptsData.attempt_count : 0;

//         // nesigurno
//         if (authVulnerabilityEnabled) {
//             if (!user || !(await bcrypt.compare(password, user.password_hash))) {
//                 return res.render('login', { error: user ? "Neispravna lozinka" : "Korisničko ime nije pronađeno", authVulnerabilityEnabled });
//             }

//             req.session.sessionId = generateSessionId();
//             req.session.user = user.username;
//             req.session.cookie.maxAge = 30000 * 24 * 60 * 60 * 1000; // 30000d
//             return res.redirect(`/auth/dashboard?sessionId=${req.session.sessionId}`);
//         }

//         // sigurno
//         if (attemptCount >= 10) {
//             return res.render('login', { error: "Previše neuspjelih pokušaja prijave. Obratite se administratoru.", authVulnerabilityEnabled });
//         } else if (attemptCount >= 5) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Delay after 5 attempts
//         }

//         if (!user || !(await bcrypt.compare(password, user.password_hash))) {
//             if (attemptsData) {
//                 await supabase
//                     .from('login_attempts')
//                     .update({ attempt_count: attemptCount + 1, last_attempt: new Date() })
//                     .eq('username', username);
//             } else {
//                 await supabase
//                     .from('login_attempts')
//                     .insert({ username, attempt_count: 1, last_attempt: new Date() });
//             }

//             return res.render('login', { error: "Prijava nije uspjela", authVulnerabilityEnabled });
//         }

//         await supabase.from('login_attempts').update({ attempt_count: 0 }).eq('username', username);

//         req.session.sessionId = generateSessionId();
//         req.session.user = user.username;
//         req.session.cookie.maxAge = 60 * 60 * 1000; // 1h
//         res.redirect('/auth/dashboard');
//     } catch (error) {
//         res.render('login', { error: "Došlo je do pogreške", authVulnerabilityEnabled });
//     }
// });

// // router.post('/logout', (req, res) => {
// //     req.session.destroy(err => {
// //         if (err) {
// //             return res.redirect('/auth/dashboard');
// //         }
// //         res.clearCookie('connect.sid');
// //         res.redirect('/auth/login');
// //     });
// // });

// router.post('/logout', (req, res) => {
//     if (authVulnerabilityEnabled) {
//         res.redirect('/auth/login');
//     } else {
//         req.session.destroy(err => {
//             if (err) {
//                 return res.redirect('/auth/dashboard');
//             }
//             res.clearCookie('connect.sid');
//             res.redirect('/auth/login');
//         });
//     }
// });


// router.get('/dashboard', (req, res) => {
//     if (!req.session.user) {
//         return res.redirect('/auth/login');
//     }
//     res.render('dashboard', { user: req.session.user });
// });

// module.exports = router;
