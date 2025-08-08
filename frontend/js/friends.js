// Friends management functionality
function initFriends() {
    // DOM Elements
    const addFriendBtn = document.getElementById('addFriendBtn');
    const viewRequestsBtn = document.getElementById('viewRequestsBtn');
    const addFriendModal = document.getElementById('addFriendModal');
    const closeAddFriendModal = document.getElementById('closeAddFriendModal');
    const friendRequestsModal = document.getElementById('friendRequestsModal');
    const closeFriendRequestsModal = document.getElementById('closeFriendRequestsModal');
    const userSearchInput = document.getElementById('userSearchInput');
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    const searchResults = document.getElementById('searchResults');
    const friendRequestsList = document.getElementById('friendRequestsList');

    // Modal handlers
    addFriendBtn.addEventListener('click', () => {
        addFriendModal.style.display = 'flex';
        setTimeout(() => addFriendModal.classList.add('show'), 10);
        userSearchInput.focus();
    });

    closeAddFriendModal.addEventListener('click', () => {
        addFriendModal.classList.remove('show');
        setTimeout(() => {
            addFriendModal.style.display = 'none';
            searchResults.innerHTML = '<div class="empty-search"><i class="fas fa-search"></i><p>Search for users to add as friends</p></div>';
            userSearchInput.value = '';
        }, 300);
    });

    viewRequestsBtn.addEventListener('click', async () => {
        try {
            await loadFriendRequests();
            friendRequestsModal.style.display = 'flex';
            setTimeout(() => friendRequestsModal.classList.add('show'), 10);
        } catch (error) {
            showToast('❌ Could not load friend requests');
        }
    });

    closeFriendRequestsModal.addEventListener('click', () => {
        friendRequestsModal.classList.remove('show');
        setTimeout(() => {
            friendRequestsModal.style.display = 'none';
        }, 300);
    });

    // Search Users
    searchUsersBtn.addEventListener('click', searchUsers);
    userSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addFriendModal) {
            closeAddFriendModal.click();
        }
        if (e.target === friendRequestsModal) {
            closeFriendRequestsModal.click();
        }
    });
}

async function loadFriends() {
    try {
        const response = await fetch(`${apiUrl}/friends`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            friends = await response.json();
            renderFriendList(friends);
            updateFriendsCount();
        } else {
            showToast('❌ Failed to load friends');
        }
    } catch (error) {
        showToast('❌ Failed to load friends');
    }
}

async function loadFriendRequests() {
    try {
        const response = await fetch(`${apiUrl}/friends/requests`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const requests = await response.json();
            displayFriendRequests(requests);
            updateRequestsBadge(requests.length);
        } else {
            showToast('❌ Failed to load friend requests');
        }
    } catch (error) {
        showToast('❌ Network error while loading friend requests');
    }
}

function updateFriendsCount() {
    const friendsCount = document.getElementById('friendsCount');
    friendsCount.textContent = friends.length;
}

function updateRequestsBadge(count) {
    const badge = document.getElementById('requestsBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function renderFriendList(friends) {
    const friendsList = document.getElementById('friendsList');
    
    if (friends.length === 0) {
        friendsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>No friends yet</h3>
                <p>Add some friends to start chatting!</p>
            </div>
        `;
        return;
    }

    friendsList.innerHTML = '';
    friends.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.className = `friend-item ${currentChatUser && currentChatUser.id === friend.id ? 'active' : ''}`;
        friendDiv.onclick = () => selectFriend(friend);
        
        const statusText = friend.status === 'online' ? 'Online' : 
            `Last seen ${formatTime(friend.lastSeen)}`;
        
        friendDiv.innerHTML = `
            <div class="friend-avatar-container">
                <img src="${friend.avatar}" alt="${friend.username}" class="friend-avatar">
                <div class="status-indicator ${friend.status}"></div>
            </div>
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(friend.username)}</div>
                <div class="friend-status">${statusText}</div>
            </div>
            <div class="friend-meta">
                <div class="last-message-time"></div>
                <div class="unread-count" style="display: none;">2</div>
            </div>
        `;
        
        friendsList.appendChild(friendDiv);
    });
}

function displayFriendRequests(requests) {
    const friendRequestsList = document.getElementById('friendRequestsList');
    friendRequestsList.innerHTML = '';

    if (requests.length === 0) {
        friendRequestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <h3>No pending requests</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }

    requests.forEach(req => {
        const div = document.createElement('div');
        div.className = 'friend-request-item';
        div.innerHTML = `
            <img src="${req.from.avatar}" alt="${req.from.username}" class="request-avatar">
            <div class="request-info">
                <div class="request-name">${escapeHtml(req.from.username)}</div>
                <div class="request-email">${escapeHtml(req.from.email)}</div>
                <div class="request-time">Just now</div>
            </div>
            <div class="request-actions">
                <button class="accept-btn" onclick="acceptRequest('${req.from._id}', this)">
                    <i class="fas fa-check"></i>
                    Accept
                </button>
                <button class="reject-btn" onclick="rejectRequest('${req.from._id}', this)">
                    <i class="fas fa-times"></i>
                    Reject
                </button>
            </div>
        `;
        friendRequestsList.appendChild(div);
    });
}

async function acceptRequest(userId, btn) {
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';

        const response = await fetch(`${apiUrl}/friends/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (response.ok) {
            btn.parentElement.parentElement.classList.add('fade-out');
            setTimeout(() => {
                btn.parentElement.parentElement.remove();
            }, 300);
            showToast('✅ Friend request accepted!', 'success');
            await loadFriends();
        } else {
            showToast(data.error || '❌ Failed to accept request');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Accept';
        }
    } catch (error) {
        showToast('❌ Network error while accepting request');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Accept';
    }
}

async function rejectRequest(userId, btn) {
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rejecting...';

        const response = await fetch(`${apiUrl}/friends/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (response.ok) {
            btn.parentElement.parentElement.classList.add('fade-out');
            setTimeout(() => {
                btn.parentElement.parentElement.remove();
            }, 300);
            showToast('🚫 Friend request rejected', 'success');
        } else {
            showToast(data.error || '❌ Failed to reject request');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-times"></i> Reject';
        }
    } catch (error) {
        showToast('❌ Network error while rejecting request');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-times"></i> Reject';
    }
}

async function searchUsers() {
    const userSearchInput = document.getElementById('userSearchInput');
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    const query = userSearchInput.value.trim();
    
    if (query.length < 2) {
        showError('Search query must be at least 2 characters');
        return;
    }

    try {
        searchUsersBtn.disabled = true;
        searchUsersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch(`${apiUrl}/users/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const users = await response.json();
            displaySearchResults(users);
        } else {
            showError('Search failed. Please try again.');
        }
    } catch (error) {
        showError('Search failed. Please try again.');
    } finally {
        searchUsersBtn.disabled = false;
        searchUsersBtn.innerHTML = '<i class="fas fa-search"></i>';
    }
}

function displaySearchResults(users) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (users.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No users found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-result';
        
        const isAlreadyFriend = friends.some(friend => friend.id === user._id);
        
        userDiv.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}" class="result-avatar">
            <div class="result-info">
                <div class="result-name">${escapeHtml(user.username)}</div>
                <div class="result-email">${escapeHtml(user.email)}</div>
            </div>
            <button class="add-friend-btn ${isAlreadyFriend ? 'disabled' : ''}" 
                    ${isAlreadyFriend ? 'disabled' : ''} 
                    onclick="sendFriendRequest('${user._id}', this)">
                <i class="fas ${isAlreadyFriend ? 'fa-check' : 'fa-user-plus'}"></i>
                ${isAlreadyFriend ? 'Already Friend' : 'Add Friend'}
            </button>
        `;
        
        searchResults.appendChild(userDiv);
    });
}

async function sendFriendRequest(userId, button) {
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const response = await fetch(`${apiUrl}/friends/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (response.ok) {
            button.innerHTML = '<i class="fas fa-check"></i> Request Sent';
            button.disabled = true;
            button.classList.add('disabled');
            showToast('✅ Friend request sent!', 'success');
        } else {
            button.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
            button.disabled = false;
            showToast(data.error || '❌ Failed to send request');
        }
    } catch (error) {
        button.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
        button.disabled = false;
        showToast('❌ Network error while sending request');
    }
}

function updateFriendsList() {
    renderFriendList(friends);
}

// Make functions globally available for onclick handlers
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.sendFriendRequest = sendFriendRequest;