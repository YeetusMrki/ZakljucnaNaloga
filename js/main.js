//Inicializacija glavne strani po nalaganju DOM
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    loadLeaderboard();
});

//Shranjuje vse vnose lestvice (API + lokalno)
let allLeaderboardEntries = [];

//Pridobi lokalno shranjene vnose lestvice iz localStorage
function getLocalLeaderboard() {
    try {
        return JSON.parse(localStorage.getItem('localLeaderboard') || '[]');
    } catch (e) {
        return [];
    }
}

//Normalizira strukturo vnosa lestvice, sprejme različne oblike
function normalizeLeaderboardEntry(entry) {
    return {
        username: entry.username || entry.USERNAME || entry.USER_NAME || entry.user_id || entry.USER_ID || entry.PLAYER || 'Anonymous',
        time: Number(entry.time_result || entry.TIME_RESULT || entry.time_seconds || entry.TIME_SECONDS || entry.TIME || entry.SCORE || entry.time || 0) || 0,
        date: entry.date || entry.DATE || entry.created_at || entry.createdAt || ''
    };
}

//Izvleče tabelo/vnosi iz API odgovora v pričakovani obliki
function extractLeaderboardData(result) {
    const data = Array.isArray(result)
        ? result
        : (result.items || result.rows || result.data || result.leaderboard || result.entries || []);
    return Array.isArray(data) ? data.map(normalizeLeaderboardEntry) : [];
}

//Upodobi HTML tabelo lestvice v dani tbody
function renderLeaderboardTable(tbodyId, entries, options = {}) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!entries || entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${options.colspan || 4}">${options.emptyMessage || 'No scores available.'}</td></tr>`;
        return;
    }

    entries.forEach((entry, index) => {
        const isCurrentUser = getCurrentUser() && entry.username.toLowerCase() === getCurrentUser().toLowerCase();
        tbody.innerHTML += `<tr class="${isCurrentUser ? 'current-user-highlight' : ''}">
            <td>${index + 1}</td>
            <td>${entry.username}${isCurrentUser ? ' (You)' : ''}</td>
            <td>${entry.time}</td>
            ${options.showDate ? `<td>${entry.date || '-'}</td>` : ''}
        </tr>`;
    });
}

//Upodobi globalno lestvico
function renderGlobalLeaderboard() {
    renderLeaderboardTable('leaderboardBody', allLeaderboardEntries, {
        colspan: 3,
        emptyMessage: 'No scores yet. Be the first!'
    });
}

//Prikaže rezultate za iskanje igralca ali trenutnega uporabnika
function renderPlayerOrSearchResults(query) {
    const normalizedQuery = (query || '').trim().toLowerCase();
    const currentUsername = getCurrentUser();

    if (!normalizedQuery) {
        const filtered = currentUsername
            ? allLeaderboardEntries.filter(entry => entry.username && entry.username.toLowerCase() === currentUsername.toLowerCase())
            : [];

        renderLeaderboardTable('searchResultsBody', filtered, {
            showDate: false,
            colspan: 3,
            emptyMessage: currentUsername
                ? 'Your scores will appear here once you have played.'
                : 'Please log in to see your scores.'
        });
        return;
    }

    const results = allLeaderboardEntries.filter(entry =>
        entry.username && entry.username.toLowerCase().includes(normalizedQuery)
    );

    if (results.length === 0) {
        const searchBody = document.getElementById('searchResultsBody');
        if (!searchBody) return;
        searchBody.innerHTML = `<tr><td colspan="4">No scores found for "${query}".</td></tr>`;
        return;
    }

    renderLeaderboardTable('searchResultsBody', results, {
        showDate: false,
        colspan: 3,
        emptyMessage: `No scores found for "${query}".`
    });
}

//Izvede iskanje rezultatov za določenega uporabnika prek API
async function renderSearchResults(username) {

    if (!username.trim()) {
        renderPlayerOrSearchResults('');
        return;
    }

    try {

        const response = await fetch(
            `${API_ENDPOINTS.leaderboard}/player/${encodeURIComponent(username)}`
        );

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const rows = await response.json();

        renderLeaderboardTable(
            'searchResultsBody',
            rows.map(normalizeLeaderboardEntry),
            {
                colspan: 3,
                emptyMessage: `No scores found for "${username}".`
            }
        );

    } catch (err) {
        console.error(err);
    }
}

//Nastavi dogodke za iskalno polje in gumb
function setupSearch() {
    const input = document.getElementById('playerSearchInput');
    const button = document.getElementById('playerSearchBtn');

    if (button) {
        button.addEventListener('click', () => {
            renderSearchResults(input ? input.value : '');
        });
    }

    if (input) {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                renderSearchResults(input.value);
            }
        });
    }
}

//Naloži lestvico iz API ter združi z lokalnimi vnosi
async function loadLeaderboard() {
    try {
        const headers = {};
        const token = getUserToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(API_ENDPOINTS.leaderboard, {
            headers
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        let result;
        try {
            result = await response.json();
        } catch (parseErr) {
            const text = await response.text().catch(() => '');
            console.warn('Leaderboard: response not JSON, raw text:', text);
            result = text;
        }

        const apiEntries = extractLeaderboardData(result);
        const localEntries = Array.isArray(getLocalLeaderboard()) ? getLocalLeaderboard().map(normalizeLeaderboardEntry) : [];
        allLeaderboardEntries = [...apiEntries, ...localEntries].sort((a, b) => a.time - b.time);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        allLeaderboardEntries = Array.isArray(getLocalLeaderboard())
            ? getLocalLeaderboard().map(normalizeLeaderboardEntry).sort((a, b) => a.time - b.time)
            : [];
    }

    renderGlobalLeaderboard();
    renderPlayerOrSearchResults(document.getElementById('playerSearchInput')?.value || '');
}