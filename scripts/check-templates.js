// Compile-check every EJS view and report syntax/include errors.
// Does not render — just confirms templates parse cleanly.
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const root = path.join(__dirname, '..', 'views');

function walk(dir) {
    const out = [];
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) out.push(...walk(full));
        else if (name.endsWith('.ejs')) out.push(full);
    }
    return out;
}

let failed = 0;
let passed = 0;
const errors = [];

for (const file of walk(root)) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    try {
        const src = fs.readFileSync(file, 'utf8');
        ejs.compile(src, { filename: file, async: false });
        console.log('OK   ' + rel);
        passed++;
    } catch (err) {
        console.log('FAIL ' + rel + '  → ' + err.message.split('\n')[0]);
        errors.push({ rel, err: err.message });
        failed++;
    }
}

console.log('\n' + passed + ' OK, ' + failed + ' failed.');
if (failed > 0) process.exit(1);
