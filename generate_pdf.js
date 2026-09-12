const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirsToScan = [
    path.join(__dirname, 'sahyog'),
    path.join(__dirname, 'sahyog-web'),
    path.join(__dirname, 'sahyog-app')
];

let combinedMarkdown = '# Sahyog Project Documentation\n\n';

for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.md') && file !== 'README.md') {
            const content = fs.readFileSync(path.join(dir, file), 'utf-8');
            combinedMarkdown += `\n\n\\pagebreak\n\n# ${file}\n\n`;
            combinedMarkdown += content;
        }
    }
}

// Write the combined markdown
const outMdPath = path.join(__dirname, 'docs', 'project-documentation.md');
fs.writeFileSync(outMdPath, combinedMarkdown);
console.log('Combined markdown created at', outMdPath);

// Generate PDF
console.log('Generating PDF...');
try {
    execSync(`npx --yes md-to-pdf "${outMdPath}"`, { stdio: 'inherit' });
    console.log('Successfully created project-documentation.pdf');
} catch (err) {
    console.error('Failed to generate PDF via npx md-to-pdf', err.message);
}
