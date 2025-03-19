const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// เช็คสถานะล็อกอิน
auth.onAuthStateChanged((user) => {
    const loginSection = document.getElementById('login-section');
    const mainContent = document.getElementById('main-content');
    const userInfo = document.getElementById('user-info');
    const profilePic = document.getElementById('profile-pic');
    const modalProfilePic = document.getElementById('modal-profile-pic');
    const profileName = document.getElementById('profile-name');

    if (user) {
        loginSection.style.display = 'none';
        mainContent.style.display = 'flex';
        userInfo.textContent = `สวัสดี ${user.displayName}! พร้อมสนุกแล้ว!`;
        profilePic.src = user.photoURL || 'https://via.placeholder.com/50';
        modalProfilePic.src = user.photoURL || 'https://via.placeholder.com/100';
        profileName.textContent = user.displayName;
        loadProfileStatus(user.uid);
        loadIdeas();
        loadChat();
    } else {
        loginSection.style.display = 'flex';
        mainContent.style.display = 'none';
        userInfo.textContent = '';
    }
});

// ล็อกอินด้วย Google
document.getElementById('login-btn').addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .catch((error) => console.error("ล็อกอินล้มเหลว:", error.message));
});

// แสดง/ซ่อนโปรไฟล์
function toggleProfile() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

// โหลดสถานะโปรไฟล์
function loadProfileStatus(userId) {
    db.collection('profiles').doc(userId).onSnapshot((doc) => {
        const status = document.getElementById('profile-status');
        if (doc.exists) {
            status.textContent = doc.data().status || 'ยังไม่มีสถานะ';
        } else {
            status.textContent = 'ยังไม่มีสถานะ';
        }
    });
}

// อัปเดตสถานะ
function updateStatus() {
    const input = document.getElementById('status-input');
    const status = input.value.trim();
    if (status && auth.currentUser) {
        db.collection('profiles').doc(auth.currentUser.uid).set({
            status: status
        }, { merge: true });
        input.value = '';
    }
}

// เพิ่มไอเดีย
function addIdea() {
    const input = document.getElementById('idea-input');
    const idea = input.value.trim();
    if (idea && auth.currentUser) {
        db.collection('ideas').add({
            text: idea,
            user: auth.currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    }
}

// โหลดไอเดีย
function loadIdeas() {
    db.collection('ideas').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        const ideasList = document.getElementById('ideas');
        ideasList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const ideaDiv = document.createElement('div');
            ideaDiv.className = 'idea-item';
            ideaDiv.textContent = `${data.user}: ${data.text}`;
            ideasList.appendChild(ideaDiv);
        });
    });
}

// ส่งข้อความแชท
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message && auth.currentUser) {
        db.collection('chat').add({
            text: message,
            user: auth.currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    }
}

// โหลดแชท
function loadChat() {
    db.collection('chat').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
        const chatBox = document.getElementById('chat');
        chatBox.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message';
            msgDiv.textContent = `${data.user}: ${data.text}`;
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}