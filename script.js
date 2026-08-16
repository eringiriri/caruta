const ICONS = ['🔒', '🔑', '🛡️', '⭐', '❤️', '⚡', '⚙️', '📶', '💾', '🖥️', '🐛', '💻'];
const COLS = 6;
const ROWS = 4;
const TOTAL_CELLS = COLS * ROWS;
const TOTAL_PAIRS = TOTAL_CELLS / 2;
const TIME_LIMIT_MS = 60000;

const el = (id) => document.getElementById(id);

const startBtn = el('startBtn');
const board = el('board');
const timerBarWrap = el('timerBarWrap');
const timerBar = el('timerBar');
const resultMessage = el('resultMessage');
const statTime = el('statTime');
const statAttempts = el('statAttempts');
const statPairs = el('statPairs');
const statClears = el('statClears');

const STATS_KEY = 'carutaStats';
const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{"clears":0}');

let cards = [];
let firstIndex = null;
let canClick = false;
let active = false;
let attempts = 0;
let matchedPairs = 0;
let timeRemaining = TIME_LIMIT_MS;
let timerInterval = null;

function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderStats() {
    statTime.textContent = (timeRemaining / 1000).toFixed(1);
    statAttempts.textContent = attempts;
    statPairs.textContent = `${matchedPairs} / ${TOTAL_PAIRS}`;
    statClears.textContent = stats.clears;
}

function saveClear() {
    stats.clears++;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function buildCards() {
    const chosen = shuffle(ICONS).slice(0, TOTAL_PAIRS);
    const pairIcons = shuffle([...chosen, ...chosen]);
    return pairIcons.map((icon) => ({ icon, revealed: false, matched: false }));
}

function renderBoard() {
    board.innerHTML = '';
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card' + (card.revealed || card.matched ? ' revealed' : '') + (card.matched ? ' matched' : '');
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${card.icon}</div>
            </div>
        `;
        cardEl.addEventListener('click', () => onCardClick(index));
        board.appendChild(cardEl);
    });
}

function onCardClick(index) {
    if (!active || !canClick) return;
    const card = cards[index];
    if (card.revealed || card.matched) return;

    card.revealed = true;
    renderBoard();

    if (firstIndex === null) {
        firstIndex = index;
        return;
    }

    canClick = false;
    attempts++;
    renderStats();
    const first = cards[firstIndex];
    const second = card;

    if (first.icon === second.icon) {
        first.matched = true;
        second.matched = true;
        matchedPairs++;
        firstIndex = null;
        canClick = true;
        renderStats();
        renderBoard();

        if (matchedPairs >= TOTAL_PAIRS) {
            endGame(true);
        }
    } else {
        setTimeout(() => {
            first.revealed = false;
            second.revealed = false;
            firstIndex = null;
            canClick = true;
            renderBoard();
        }, 700);
    }
}

function tick() {
    timeRemaining -= 100;
    if (timeRemaining <= 0) {
        timeRemaining = 0;
        renderStats();
        updateTimerBar();
        endGame(false);
        return;
    }
    renderStats();
    updateTimerBar();
}

function updateTimerBar() {
    const pct = (timeRemaining / TIME_LIMIT_MS) * 100;
    timerBar.style.width = pct + '%';
    timerBar.classList.toggle('danger', pct < 25);
}

function endGame(success) {
    active = false;
    canClick = false;
    clearInterval(timerInterval);
    timerInterval = null;

    resultMessage.textContent = success ? `クリア!(${attempts}手)` : 'タイムアップ...';
    resultMessage.className = 'result-message ' + (success ? 'success' : 'fail');

    if (success) saveClear();
    renderStats();
    startBtn.disabled = false;
    startBtn.textContent = 'もう一度';
}

function startGame() {
    startBtn.disabled = true;
    resultMessage.textContent = '';
    resultMessage.className = 'result-message';

    cards = buildCards();
    firstIndex = null;
    canClick = true;
    active = true;
    attempts = 0;
    matchedPairs = 0;
    timeRemaining = TIME_LIMIT_MS;

    renderStats();
    updateTimerBar();
    renderBoard();

    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 100);
}

startBtn.addEventListener('click', startGame);
renderStats();
renderBoard();
