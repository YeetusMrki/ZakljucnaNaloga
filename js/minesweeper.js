/* poveži s sejo uporabnika in zapisi rezultate na bazo. */
/* Konfiguracija igre */

// Require user to be authenticated
requireAuth();

const BOARD_WIDTH = 30;
const BOARD_HEIGHT = 24;
const MINE_COUNT = 72;

let gameBoard = [];
let revealed = [];
let flags = [];
let startTime = null;
let timerInterval = null;
let gameActive = true;

function initializeMinesweeper() {
    closeEndGameModal();
    showGameContainer();
    createBoard();
}

function showGameContainer() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.display = 'block';
    startTimer();
}

function createBoard() {
    /* Ustvari prazno mrežo in matriko */
    gameBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    revealed = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    flags = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));

    /* Postavitev min */
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
        const row = Math.floor(Math.random() * BOARD_HEIGHT);
        const col = Math.floor(Math.random() * BOARD_WIDTH);
        
        if (gameBoard[row][col] !== 'M') {
            gameBoard[row][col] = 'M';
            minesPlaced++;
        }
    }

    /* Izračunaj število sosednjih min za varne celice */
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (gameBoard[row][col] !== 'M') {
                gameBoard[row][col] = countAdjacentMines(row, col);
            }
        }
    }
    renderBoard();
}

function countAdjacentMines(row, col) {
    let count = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH) {
                if (gameBoard[r][c] === 'M') {
                    count++;
                }
            }
        }
    }
    return count;
}

function renderBoard() {
    const boardElement = document.getElementById('minesweeper-board');
    boardElement.innerHTML = '';

    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            const cell = document.createElement('div');
            cell.className = 'minesweeper-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            cell.addEventListener('click', () => revealCell(row, col, cell));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(row, col, cell);
            });

            boardElement.appendChild(cell);
        }
    }
}

function revealCell(row, col, cellElement) {
    if (!gameActive) return;

    // Handle chord action if clicking on a revealed number
    if (revealed[row][col] && gameBoard[row][col] > 0) {
        handleChord(row, col);
        return;
    }

    if (revealed[row][col]) return;

    revealed[row][col] = true;
    cellElement.classList.add('revealed');

    if (gameBoard[row][col] === 'M') {
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
        endGame(false);
    } else {
        const count = gameBoard[row][col];
        if (count > 0) {
            cellElement.textContent = count;
        }

        /* Rekurzivno odpri sosednje celice, če ta celica nima sosednjih min */
        if (count === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH && !revealed[r][c]) {
                        const adjacentCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                        revealCell(r, c, adjacentCell);
                    }
                }
            }
        }

        checkWin();
    }
}

function toggleFlag(row, col, cellElement) {
    if (revealed[row][col] || !gameActive) return;
    
    flags[row][col] = !flags[row][col];
    cellElement.textContent = flags[row][col] ? '🚩' : '';
}

function handleChord(row, col) {
    let flagCount = 0;
    let adjacentCells = [];

    // Count flags around this number and collect adjacent cell info
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH && !(r === row && c === col)) {
                if (flags[r][c]) {
                    flagCount++;
                    adjacentCells.push({ row: r, col: c, isFlagged: true });
                } else if (!revealed[r][c]) {
                    adjacentCells.push({ row: r, col: c, isFlagged: false });
                }
            }
        }
    }

    // Check if flag count matches the number
    if (flagCount !== gameBoard[row][col]) return;

    // Verify all flagged cells are actually mines, if not end game (lose)
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH && flags[r][c]) {
                if (gameBoard[r][c] !== 'M') {
                    endGame(false); // Wrong flag, lose
                    return;
                }
            }
        }
    }

    // Reveal all unrevealed non-flagged cells around this number
    for (let cell of adjacentCells) {
        if (!cell.isFlagged && !revealed[cell.row][cell.col]) {
            const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
            revealCell(cell.row, cell.col, cellElement);
        }
    }
}

function endGame(won) {
    gameActive = false;
    clearInterval(timerInterval);
    showEndGameModal(won);
}

function showEndGameModal(won) {
    const modal = document.getElementById('endgame-modal');
    if (!modal) return;

    const title = document.getElementById('endgame-title');
    const message = document.getElementById('endgame-message');
    const quitBtn = document.getElementById('quit-save-btn');
    const retryBtn = document.getElementById('retry-save-btn');

    title.textContent = won ? 'You Won!' : 'You Lost';
    message.textContent = won ? 'Congratulations, you won the game!' : 'Oops, you hit a mine.';

    if (won) {
        quitBtn.textContent = 'Quit and Save Score';
        retryBtn.textContent = 'Try Again and Save Score';
        quitBtn.onclick = () => {
            saveScore(true);
            window.location.href = 'mainpage.html';
        };
        retryBtn.onclick = () => {
            saveScore(true);
            closeEndGameModal();
            resetGame();
        };
    } else {
        quitBtn.textContent = 'Quit';
        retryBtn.textContent = 'Try Again';
        quitBtn.onclick = () => {
            window.location.href = 'mainpage.html';
        };
        retryBtn.onclick = () => {
            closeEndGameModal();
            resetGame();
        };
    }

    modal.classList.remove('hidden');
}

function closeEndGameModal() {
    const modal = document.getElementById('endgame-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function saveScore(won) {
    // Only save if the game was won
    if (!won) {
        console.log('Game lost - score not saved.');
        return;
    }

    const time = parseInt(document.getElementById('timer').textContent, 10) || 0;
    const username = getCurrentUser() || 'Anonymous';
    const scoreEntry = {
        username: username,
        time: time,
        date: new Date().toISOString()
    };

    // Try to save to API
    saveScoreToAPI(scoreEntry);

    // Also save to localStorage as fallback
    const leaderboard = JSON.parse(localStorage.getItem('minesweeperScores') || '[]');
    leaderboard.push(scoreEntry);
    localStorage.setItem('minesweeperScores', JSON.stringify(leaderboard));

    console.log('Score saved:', scoreEntry);
}

async function saveScoreToAPI(scoreEntry) {
    try {
        const payload = {
            user_id: getUserId() || getCurrentUser() || 'Anonymous',
            time_result: scoreEntry.time
        };

        const response = await fetch(API_ENDPOINTS.saveGame, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getUserToken()}`
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201) {
            console.log('Score saved to API successfully');
        } else {
            console.warn('API returned status:', response.status);
        }
    } catch (err) {
        console.warn('Could not save score to API, using localStorage only:', err);
    }
}

function resetGame() {
    const boardElement = document.getElementById('minesweeper-board');
    boardElement.innerHTML = '';

    gameActive = true;
    startTime = null;
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '000';
    gameBoard = [];
    revealed = [];
    flags = [];
    initializeMinesweeper();
}

function checkWin() {
    let revealedCount = 0;
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (revealed[row][col]) revealedCount++;
        }
    }

    if (revealedCount === BOARD_WIDTH * BOARD_HEIGHT - MINE_COUNT) {
        endGame(true);
    }
}

function startTimer() {
    startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timerDisplay = Math.min(elapsed, 999);
        document.getElementById('timer').textContent = String(timerDisplay).padStart(3, '0');
    }, 100);
}

window.addEventListener('DOMContentLoaded', () => {
    initializeMinesweeper();
});