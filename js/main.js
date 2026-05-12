/* Nadzor navigacije glavne strani */

// Require user to be authenticated
requireAuth();

async function fetchLeaderboardFromAPI() {
    try {
        const response = await fetch(`${API_ENDPOINTS.leaderboard}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Leaderboard API error:', response.status);
            return null;
        }

        const data = await response.json();
        return data.scores || data || [];
    } catch (err) {
        console.warn('Could not fetch leaderboard from API:', err);
    }
    return null;
}

async function getLeaderboardScores() {
    // Try to fetch from API first
    let scores = await fetchLeaderboardFromAPI();
    
    // Fallback to localStorage if API unavailable
    if (!scores || scores.length === 0) {
        scores = JSON.parse(localStorage.getItem('minesweeperScores') || '[]');
    }

    // Sort by lowest win time and return the top 10 results
    return scores
        .filter(entry => entry && (entry.time !== undefined || entry.time_result !== undefined))
        .sort((a, b) => {
            const timeA = Number(a.time ?? a.time_result ?? 0);
            const timeB = Number(b.time ?? b.time_result ?? 0);
            return timeA - timeB;
        })
        .slice(0, 10);
}

async function renderLeaderboard() {
    const leaderBoardBody = document.getElementById('leaderboardBody');
    if (!leaderBoardBody) return;

    const topScores = await getLeaderboardScores();
    leaderBoardBody.innerHTML = '';

    if (topScores.length === 0) {
        leaderBoardBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#aaa;">No finished games.</td></tr>';
        return;
    }

    topScores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        const rankTd = document.createElement('td');
        const playerTd = document.createElement('td');
        const timeTd = document.createElement('td');

        const timeValue = Number(entry.time ?? entry.time_result ?? 0);

        rankTd.textContent = index + 1;
        playerTd.textContent = entry.username || entry.player || entry.name || 'Unknown';
        timeTd.textContent = timeValue;

        tr.appendChild(rankTd);
        tr.appendChild(playerTd);
        tr.appendChild(timeTd);
        leaderBoardBody.appendChild(tr);
    });
}

/* Prikaži samo vsebino lestvice */
async function showLeaderboard() {
    await renderLeaderboard();
    document.getElementById('leaderboard-section').style.display = 'block';
    document.getElementById('play-section').style.display = 'none';
}

/* Prikaži vsebino igranja in skrij lestvico */
function showPlay() {
    document.getElementById('leaderboard-section').style.display = 'none';
    document.getElementById('play-section').style.display = 'block';
}

/* Inicializacija ozadja animacije */
function initializeBackgroundAnimation() {
    const backgroundDiv = document.getElementById('background-animation');
    if (!backgroundDiv) return;

    // Get the size of the container
    const containerWidth = backgroundDiv.parentElement.offsetWidth;
    const containerHeight = backgroundDiv.parentElement.offsetHeight;
    const cellSize = 15;
    const gap = 1;
    const cellWithGap = cellSize + gap;

    const width = Math.ceil(containerWidth / cellWithGap) + 1; // +1 to ensure coverage
    const height = Math.ceil(containerHeight / cellWithGap) + 1;

    backgroundDiv.style.display = 'grid';
    backgroundDiv.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    backgroundDiv.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
    backgroundDiv.style.gap = `${gap}px`;

    // Create cells
    for (let i = 0; i < width * height; i++) {
        const cell = document.createElement('div');
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.backgroundColor = '#2d2d2d';
        cell.style.border = '1px solid #505050';
        cell.style.transition = 'background-color 0.5s ease';
        backgroundDiv.appendChild(cell);
    }

    // Animate
    const cells = backgroundDiv.children;
    setInterval(() => {
        // Randomly reveal some cells
        const numToReveal = Math.floor(Math.random() * 15) + 5; // 5 to 20 cells
        for (let i = 0; i < numToReveal; i++) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            const cell = cells[randomIndex];
            // Simulate revealing: change to a lighter color
            cell.style.backgroundColor = '#1a1a1a';
            // After some time, reset to unrevealed
            setTimeout(() => {
                cell.style.backgroundColor = '#2d2d2d';
            }, Math.random() * 2000 + 1000); // 1-3 seconds
        }
    }, 300); // Every 0.3 seconds
}

// Auto-refresh leaderboard every 60 seconds
setInterval(async () => {
    await renderLeaderboard();
}, 60000);

// Initialize on load
initializeBackgroundAnimation();
renderLeaderboard();