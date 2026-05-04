/**
 * generate-pr-description.js
 *
 * Generates a PR description from commits + diff.
 * Two modes controlled by the PR_DESC_MODE env var:
 *
 *   "commits" , free, no API key needed. Formats commit history + file changes.
 *   "ai"      : sends the diff to an LLM (OpenAI or Anthropic) for a rich summary.
 *
 * Required env vars:
 *   GITHUB_TOKEN         : automatically provided by GitHub Actions
 *   PR_NUMBER            : the pull request number
 *   GITHUB_REPOSITORY    : owner/repo (automatic)
 *   PR_DESC_MODE         , "commits" | "ai"  (default: "commits")
 *
 * For AI mode, one of:
 *   OPENAI_API_KEY   : OpenAI API key
 *   ANTHROPIC_API_KEY   : Anthropic API key
 *
 * Optional:
 *   AI_MODEL             : model override (default: gpt-4o-mini / claude-sonnet-4-20250514)
 *   PR_DESC_MAX_DIFF_CHARS, max diff characters sent to AI (default: 12000)
 */

const https = require('https');

// ── Config ──────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"
const PR_NUMBER = process.env.PR_NUMBER;
const MODE = (process.env.PR_DESC_MODE || 'commits').toLowerCase();
const MAX_DIFF = parseInt(process.env.PR_DESC_MAX_DIFF_CHARS || '12000', 10);

// ── Helpers ─────────────────────────────────────────────────────────

function request(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const opts = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'gigify-pr-bot',
                Accept: 'application/vnd.github+json',
                ...options.headers,
            },
        };

        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
                } else {
                    resolve(JSON.parse(data));
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

function requestRaw(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const opts = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'gigify-pr-bot',
                Accept: 'application/vnd.github.v3.diff',
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                ...options.headers,
            },
        };

        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.end();
    });
}

const ghHeaders = { Authorization: `Bearer ${GITHUB_TOKEN}` };

async function getPR() {
    return request(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`, { headers: ghHeaders });
}

async function getCommits() {
    return request(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/commits?per_page=100`, {
        headers: ghHeaders,
    });
}

async function getFiles() {
    return request(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`, {
        headers: ghHeaders,
    });
}

async function getDiff() {
    return requestRaw(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`);
}

async function updatePRBody(body) {
    return request(
        `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`,
        {
            method: 'PATCH',
            headers: {
                ...ghHeaders,
                'Content-Type': 'application/json',
            },
        },
        JSON.stringify({ body }),
    );
}

// ── Commit-based description (free, no AI) ──────────────────────────

function categorizeFile(filename) {
    if (filename.startsWith('.github/')) return 'CI/CD';
    if (filename.match(/\.(spec|test)\.(ts|js|tsx|jsx)$/)) return 'Tests';
    if (filename.match(/migration|seed/i)) return 'Database';
    if (filename.match(/\.md$/)) return 'Docs';
    if (filename.match(/config|\.env|docker|fly\.toml/i)) return 'Config';
    if (filename.match(/router/i)) return 'Routes';
    if (filename.match(/service/i)) return 'Services';
    if (filename.match(/repository/i)) return 'Data Layer';
    if (filename.match(/interface|types/i)) return 'Types';
    if (filename.match(/views.*\.(ts|html)/)) return 'Templates';
    return 'Other';
}

function generateCommitDescription(pr, commits, files) {
    const lines = [];

    // Title section
    lines.push('## Summary');
    lines.push('');

    // Commit log
    const commitMessages = commits.map((c) => {
        const msg = c.commit.message.split('\n')[0]; // first line only
        const sha = c.sha.slice(0, 7);
        return `- [\`${sha}\`](${c.html_url}) ${msg}`;
    });
    lines.push('### Commits');
    lines.push('');
    lines.push(...commitMessages);
    lines.push('');

    // File changes grouped by category
    const grouped = {};
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const file of files) {
        const cat = categorizeFile(file.filename);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(file);
        totalAdditions += file.additions;
        totalDeletions += file.deletions;
    }

    lines.push(`### Changes, \`+${totalAdditions}\` / \`-${totalDeletions}\` across ${files.length} files`);
    lines.push('');

    const categoryOrder = ['Routes', 'Services', 'Data Layer', 'Types', 'Templates', 'Tests', 'Database', 'Config', 'CI/CD', 'Docs', 'Other'];

    for (const cat of categoryOrder) {
        if (!grouped[cat]) continue;
        lines.push(`<details><summary><strong>${cat}</strong> (${grouped[cat].length} files)</summary>`);
        lines.push('');
        for (const f of grouped[cat]) {
            const status = f.status === 'added' ? '🆕' : f.status === 'removed' ? '🗑️' : '✏️';
            lines.push(`- ${status} \`${f.filename}\` (+${f.additions}/-${f.deletions})`);
        }
        lines.push('');
        lines.push('</details>');
        lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`> Auto-generated from ${commits.length} commit(s) • \`${pr.base.ref}\` ← \`${pr.head.ref}\``);

    return lines.join('\n');
}

// ── AI-powered description ──────────────────────────────────────────

async function callOpenAI(prompt) {
    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    const data = await request(
        'https://api.openai.com/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        },
        JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a senior engineer writing clear, concise pull request descriptions.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 1500,
            temperature: 0.3,
        }),
    );
    return data.choices[0].message.content;
}

async function callAnthropic(prompt) {
    const model = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
    const data = await request(
        'https://api.anthropic.com/v1/messages',
        {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
        },
        JSON.stringify({
            model,
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
            system: 'You are a senior engineer writing clear, concise pull request descriptions. Output clean Markdown. Do not wrap in code fences.',
        }),
    );
    return data.content[0].text;
}

async function generateAIDescription(pr, commits, files, diff) {
    // Build the prompt
    const commitList = commits.map((c) => `- ${c.commit.message.split('\n')[0]}`).join('\n');
    const fileList = files.map((f) => `${f.status} ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n');
    const trimmedDiff = diff.length > MAX_DIFF ? diff.slice(0, MAX_DIFF) + '\n\n[... diff truncated ...]' : diff;

    const prompt = `Write a pull request description for the following changes.

**Branch:** \`${pr.head.ref}\` → \`${pr.base.ref}\`
**PR Title:** ${pr.title}

### Commits
${commitList}

### Files Changed
${fileList}

### Diff
\`\`\`diff
${trimmedDiff}
\`\`\`

Write the description in this format:

## Summary
A 2-3 sentence high-level overview of what this PR does and why.

## What Changed
Bullet points grouped by area (e.g. API, Database, Config, Tests). Be specific about what was added, changed, or removed.

## Testing
How the changes were or should be tested.

## Notes
Any migration steps, env var changes, or things reviewers should pay attention to. Omit this section if there's nothing noteworthy.

Keep it concise and professional. No filler.`;

    // Pick the AI provider
    if (process.env.ANTHROPIC_API_KEY) {
        console.log('Using Anthropic API...');
        return callAnthropic(prompt);
    } else if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI API...');
        return callOpenAI(prompt);
    } else {
        throw new Error('AI mode requires OPENAI_API_KEY or ANTHROPIC_API_KEY secret to be set.');
    }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
    console.log(`PR #${PR_NUMBER} | Mode: ${MODE}`);

    const [pr, commits, files] = await Promise.all([getPR(), getCommits(), getFiles()]);

    let description;

    if (MODE === 'ai') {
        const diff = await getDiff();
        const aiBody = await generateAIDescription(pr, commits, files, diff);
        description = aiBody + '\n\n---\n> 🤖 Generated by AI (`' + MODE + '` mode)';
    } else {
        description = generateCommitDescription(pr, commits, files);
    }

    await updatePRBody(description);
    console.log('PR description updated successfully.');
}

main().catch((err) => {
    console.error('Failed to generate PR description:', err.message);
    process.exit(1);
});
