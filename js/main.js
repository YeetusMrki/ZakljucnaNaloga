document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
});

function getLocalLeaderboard() {
    try {
        return JSON.parse(localStorage.getItem('localLeaderboard') || '[]');
    } catch (e) {
        return [];
    }
}

function normalizeLeaderboardEntry(entry) {
    return {
        username: entry.username || entry.USERNAME || entry.USER_NAME || entry.user_id || entry.USER_ID || entry.PLAYER || 'Anonymous',
        time: Number(entry.time_result || entry.TIME_RESULT || entry.time_seconds || entry.TIME_SECONDS || entry.TIME || entry.SCORE || entry.time || 0) || 0,
        date: entry.date || entry.DATE || entry.created_at || entry.createdAt || ''
    };
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    try {
        const headers = {};
        const token = getUserToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(API_ENDPOINTS.leaderboard, {
            headers
        });
        
        if (!response.ok) throw new Error('Failed to fetch data');
        
        // Try to parse JSON, but be tolerant of non-JSON responses
        let result;
        try {
            result = await response.json();
        } catch (parseErr) {
            const text = await response.text().catch(() => '');
            console.warn('Leaderboard: response not JSON, raw text:', text);
            result = text;
        }
        console.log("Leaderboard raw result:", result);

        // Robust data extraction for different API response structures
        const data = Array.isArray(result) ? result : (result.items || result.rows || result.data || result.leaderboard || result.entries || []);

        // Normalize entries to a common shape: { username, time, date }
        const combined = [];
        (Array.isArray(data) ? data : []).forEach(e => combined.push(normalizeLeaderboardEntry(e)));
        (Array.isArray(getLocalLeaderboard()) ? getLocalLeaderboard() : []).forEach(e => combined.push(normalizeLeaderboardEntry(e)));

        // Sort ascending by time (lower is better)
        combined.sort((a, b) => a.time - b.time);

        tbody.innerHTML = '';
        if (!combined || combined.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No scores yet. Be the first!</td></tr>';
            return;
        }

        const currentUsername = getCurrentUser();

        combined.forEach((entry, index) => {
            const isCurrentUser = currentUsername && (entry.username === currentUsername);
            const row = `<tr class="${isCurrentUser ? 'current-user-highlight' : ''}">
                <td>${index + 1}</td>
                <td>${entry.username}${isCurrentUser ? ' (You)' : ''}</td>
                <td>${entry.time}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        const localScores = getLocalLeaderboard().map(normalizeLeaderboardEntry).sort((a, b) => a.time - b.time);
        if (localScores.length > 0) {
            tbody.innerHTML = '';
            const currentUsername = getCurrentUser();
            localScores.forEach((entry, index) => {
                const isCurrentUser = currentUsername && (entry.username === currentUsername);
                tbody.innerHTML += `<tr class="${isCurrentUser ? 'current-user-highlight' : ''}">
                    <td>${index + 1}</td>
                    <td>${entry.username}${isCurrentUser ? ' (You)' : ''}</td>
                    <td>${entry.time}</td>
                </tr>`;
            });
            return;
        }
        tbody.innerHTML = '<tr><td colspan="3">Failed to load leaderboard.</td></tr>';
    }
}