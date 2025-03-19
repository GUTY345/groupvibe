// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyABVE8SqX0EkXEVZMaCXTq-dFFXCNTKkm8",
    authDomain: "groupvibe-d5bd5.firebaseapp.com",
    projectId: "groupvibe-d5bd5",
    storageBucket: "groupvibe-d5bd5.appspot.com",
    messagingSenderId: "920127227376",
    appId: "1:920127227376:web:2a97863bd2ac6336234935"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Theme Toggle
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const body = document.body;

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark');
            localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
        });
    }

    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', () => {
            body.classList.toggle('dark');
            localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
        });
    }
});

// Toggle More Menu for Mobile
function toggleMoreMenu(event) {
    event.preventDefault();
    const moreMenuContent = document.querySelector('.more-menu-content');
    moreMenuContent.style.display = moreMenuContent.style.display === 'block' ? 'none' : 'block';
}

// Sign Out
function signOut() {
    auth.signOut().then(() => {
        console.log("ออกจากระบบสำเร็จ");
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error("ออกจากระบบล้มเหลว:", error.message);
        alert("ออกจากระบบล้มเหลว: " + error.message);
    });
}

// Post Modal
function openPostModal() {
    document.getElementById('post-modal').style.display = 'block';
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
    document.getElementById('modal-post-input').value = '';
    document.getElementById('modal-post-file').value = '';
}

function submitPost() {
    const postInput = document.getElementById('modal-post-input');
    const postFile = document.getElementById('modal-post-file');
    const user = auth.currentUser;

    if (!user) {
        alert("กรุณาล็อกอินก่อนโพสต์");
        return;
    }

    if (postInput.value.trim() === '' && !postFile.files[0]) {
        alert("กรุณาใส่ข้อความหรือเลือกไฟล์");
        return;
    }

    const postData = {
        content: postInput.value,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
        commentsCount: 0 // เปลี่ยนจาก comments เป็น commentsCount เพื่อนับจำนวน
    };

    if (postFile.files[0]) {
        const file = postFile.files[0];
        const storageRef = storage.ref(`posts/${user.uid}/${Date.now()}_${file.name}`);
        storageRef.put(file).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                postData.imageURL = downloadURL;
                db.collection('posts').add(postData).then(() => {
                    closePostModal();
                }).catch((error) => {
                    console.error("Error adding post:", error);
                    alert("เกิดข้อผิดพลาดในการโพสต์: " + error.message);
                });
            }).catch((error) => {
                console.error("Error getting download URL:", error);
                alert("เกิดข้อผิดพลาดในการอัปโหลดรูป: " + error.message);
            });
        }).catch((error) => {
            console.error("Error uploading file:", error);
            alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์: " + error.message);
        });
    } else {
        db.collection('posts').add(postData).then(() => {
            closePostModal();
        }).catch((error) => {
            console.error("Error adding post:", error);
            alert("เกิดข้อผิดพลาดในการโพสต์: " + error.message);
        });
    }
}

// Load Posts
let currentPostsQuery = db.collection('posts').orderBy('timestamp', 'desc');

currentPostsQuery.onSnapshot((snapshot) => {
    const postsDiv = document.getElementById('posts');
    if (!postsDiv) return;

    const user = auth.currentUser;
    postsDiv.innerHTML = '';
    snapshot.forEach((doc) => {
        const post = doc.data();
        const isLiked = user && post.likes && post.likes.includes(user.uid);
        const isOwnPost = user && post.userId === user.uid;
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="user-info">
                    <img src="${post.userPhoto || 'https://via.placeholder.com/32'}" alt="Profile">
                    <p onclick="goToProfile('${post.userId}')">${post.userName}</p>
                </div>
                ${isOwnPost ? `<button class="delete-post" onclick="deletePost('${doc.id}')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
            ${post.imageURL ? `<img src="${post.imageURL}" alt="Post Image" class="post-image">` : ''}
            <div class="post-actions">
                <button onclick="likePost('${doc.id}')" class="${isLiked ? 'liked' : ''}"><i class="far fa-heart"></i></button>
                <button onclick="alert('ฟังก์ชันแชร์ยังไม่พร้อมใช้งาน')"><i class="far fa-paper-plane"></i></button>
            </div>
            <div class="post-stats">
                <p>${post.likes ? post.likes.length : 0} ถูกใจ</p>
                <p id="comment-count-${doc.id}">${post.commentsCount || 0} ความคิดเห็น</p>
            </div>
            <div class="post-content">
                <p><strong>${post.userName}</strong> ${post.content}</p>
            </div>
            <div class="post-comments">
                <div class="comment-list" id="comment-list-${doc.id}"></div>
                ${user ? `
                    <div class="comment-input">
                        <input type="text" id="comment-input-${doc.id}" placeholder="เพิ่มความคิดเห็น...">
                        <button onclick="addComment('${doc.id}')">ส่ง</button>
                    </div>
                ` : ''}
            </div>
        `;
        postsDiv.appendChild(postDiv);
        loadComments(doc.id);
        if (user) {
            listenForNewComments(doc.id);
        }
    });
});

// Delete Post
function deletePost(postId) {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?")) {
        db.collection('posts').doc(postId).delete().then(() => {
            console.log("ลบโพสต์สำเร็จ");
        }).catch((error) => {
            console.error("Error deleting post:", error);
            alert("เกิดข้อผิดพลาดในการลบโพสต์: " + error.message);
        });
    }
}

// Like Post
function likePost(postId) {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนกดไลค์");
        return;
    }

    const postRef = db.collection('posts').doc(postId);
    postRef.get().then((doc) => {
        const likes = doc.data().likes || [];
        if (likes.includes(user.uid)) {
            postRef.update({
                likes: firebase.firestore.FieldValue.arrayRemove(user.uid)
            });
        } else {
            postRef.update({
                likes: firebase.firestore.FieldValue.arrayUnion(user.uid)
            });
        }
    });
}

// Add Comment
function addComment(postId) {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนแสดงความคิดเห็น");
        return;
    }

    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (!commentInput || commentInput.value.trim() === '') {
        alert("กรุณาใส่ความคิดเห็น");
        return;
    }

    const commentData = {
        content: commentInput.value,
        userId: user.uid,
        userName: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: []
    };

    db.collection('posts').doc(postId).collection('comments').add(commentData)
        .then(() => {
            commentInput.value = '';
            db.collection('posts').doc(postId).update({
                commentsCount: firebase.firestore.FieldValue.increment(1)
            });
        }).catch((error) => {
            console.error("Error adding comment:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น: " + error.message);
        });
}

// Load Comments
function loadComments(postId) {
    const commentList = document.getElementById(`comment-list-${postId}`);
    if (!commentList) return;

    db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            commentList.innerHTML = '';
            snapshot.forEach((doc) => {
                const comment = doc.data();
                const user = auth.currentUser;
                const isOwnComment = user && comment.userId === user.uid;
                const isLiked = user && comment.likes && comment.likes.includes(user.uid);
                const commentDiv = document.createElement('div');
                commentDiv.classList.add('comment-item');
                commentDiv.innerHTML = `
                    <div class="comment-info">
                        <p class="username" onclick="goToProfile('${comment.userId}')">${comment.userName}</p>
                        <p>${comment.content}</p>
                    </div>
                    <div class="comment-actions">
                        <button onclick="likeComment('${postId}', '${doc.id}')" class="${isLiked ? 'liked' : ''}"><i class="far fa-heart"></i> ${comment.likes ? comment.likes.length : 0}</button>
                        ${isOwnComment ? `
                            <button onclick="editComment('${postId}', '${doc.id}', '${comment.content}')">แก้ไข</button>
                            <button onclick="deleteComment('${postId}', '${doc.id}')">ลบ</button>
                        ` : ''}
                    </div>
                `;
                commentList.appendChild(commentDiv);
            });
        });
}

// Listen for New Comments
function listenForNewComments(postId) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('posts').doc(postId).collection('comments')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const comment = change.doc.data();
                    if (comment.userId !== user.uid) {
                        alert(`มีคอมเมนต์ใหม่ในโพสต์: ${comment.userName} ได้คอมเมนต์ "${comment.content}"`);
                    }
                }
            });
        });
}

// Like Comment
function likeComment(postId, commentId) {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนกดถูกใจ");
        return;
    }

    const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
    commentRef.get().then((doc) => {
        const likes = doc.data().likes || [];
        if (likes.includes(user.uid)) {
            commentRef.update({
                likes: firebase.firestore.FieldValue.arrayRemove(user.uid)
            });
        } else {
            commentRef.update({
                likes: firebase.firestore.FieldValue.arrayUnion(user.uid)
            });
        }
    });
}

// Edit Comment
function editComment(postId, commentId, currentContent) {
    const newContent = prompt("แก้ไขความคิดเห็น:", currentContent);
    if (newContent && newContent.trim() !== '') {
        db.collection('posts').doc(postId).collection('comments').doc(commentId).update({
            content: newContent
        }).catch((error) => {
            console.error("Error editing comment:", error);
            alert("เกิดข้อผิดพลาดในการแก้ไขความคิดเห็น: " + error.message);
        });
    }
}

// Delete Comment
function deleteComment(postId, commentId) {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้?")) {
        db.collection('posts').doc(postId).collection('comments').doc(commentId).delete().then(() => {
            console.log("ลบความคิดเห็นสำเร็จ");
            db.collection('posts').doc(postId).update({
                commentsCount: firebase.firestore.FieldValue.increment(-1)
            });
        }).catch((error) => {
            console.error("Error deleting comment:", error);
            alert("เกิดข้อผิดพลาดในการลบความคิดเห็น: " + error.message);
        });
    }
}

// Go to Profile
function goToProfile(userId) {
    window.location.href = `profile.html?userId=${userId}`;
}

// Search Feed
function searchFeed() {
    const searchInput = document.getElementById('search-input').value.trim().toLowerCase();
    if (searchInput === '') {
        currentPostsQuery = db.collection('posts').orderBy('timestamp', 'desc');
        return;
    }

    db.collection('users').where('displayName', '>=', searchInput)
        .where('displayName', '<=', searchInput + '\uf8ff')
        .get().then((userSnapshot) => {
            const userIds = [];
            userSnapshot.forEach((doc) => {
                userIds.push(doc.id);
            });

            if (userIds.length > 0) {
                currentPostsQuery = db.collection('posts')
                    .where('userId', 'in', userIds)
                    .orderBy('timestamp', 'desc');
            } else {
                currentPostsQuery = db.collection('posts')
                    .where('content', '>=', searchInput)
                    .where('content', '<=', searchInput + '\uf8ff')
                    .orderBy('timestamp', 'desc');
            }
        }).catch((error) => {
            console.error("Error searching users:", error);
            alert("เกิดข้อผิดพลาดในการค้นหา: " + error.message);
        });
}

// Group Modal
function openGroupModal() {
    document.getElementById('group-modal').style.display = 'block';
}

function closeGroupModal() {
    document.getElementById('group-modal').style.display = 'none';
    document.getElementById('group-name-input').value = '';
}

function createGroup() {
    const groupNameInput = document.getElementById('group-name-input');
    const user = auth.currentUser;

    if (!user) {
        alert("กรุณาล็อกอินก่อนสร้างกลุ่ม");
        return;
    }

    if (groupNameInput.value.trim() === '') {
        alert("กรุณาใส่ชื่อกลุ่ม");
        return;
    }

    db.collection('groups').add({
        name: groupNameInput.value,
        creatorId: user.uid,
        members: [user.uid],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeGroupModal();
    }).catch((error) => {
        console.error("Error creating group:", error);
        alert("เกิดข้อผิดพลาดในการสร้างกลุ่ม: " + error.message);
    });
}

// Load Groups
let currentGroupId = null;
let currentChatType = null;
let currentChatId = null;

db.collection('groups').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
    const groupList = document.getElementById('group-list');
    if (!groupList) return;

    const user = auth.currentUser;
    if (!user) return;

    groupList.innerHTML = '';
    snapshot.forEach((doc) => {
        const group = doc.data();
        if (group.members.includes(user.uid)) {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('chat-item');
            groupDiv.innerHTML = `
                <img src="https://via.placeholder.com/40" alt="Group">
                <div class="chat-info" onclick="selectGroup('${doc.id}', '${group.name}')">
                    <h4>${group.name}</h4>
                    <p id="group-last-message-${doc.id}">ยังไม่มีข้อความ</p>
                </div>
                <div id="group-unread-${doc.id}" class="chat-unread" style="display: none;"></div>
                <button onclick="deleteChat('group', '${doc.id}')">ลบ</button>
            `;
            groupList.appendChild(groupDiv);
            loadLastMessage('group', doc.id, group.name);
            listenForNewMessages('group', doc.id);
        }
    });
});

// Load Private Chats
db.collection('privateChats').onSnapshot((snapshot) => {
    const privateChatList = document.getElementById('private-chat-list');
    if (!privateChatList) return;

    const user = auth.currentUser;
    if (!user) return;

    privateChatList.innerHTML = '';
    snapshot.forEach((doc) => {
        const chat = doc.data();
        if (chat.participants.includes(user.uid)) {
            const otherUserId = chat.participants.find(id => id !== user.uid);
            db.collection('users').doc(otherUserId).get().then((userDoc) => {
                const otherUser = userDoc.data();
                const chatDiv = document.createElement('div');
                chatDiv.classList.add('chat-item');
                chatDiv.innerHTML = `
                    <img src="${otherUser.photoURL || 'https://via.placeholder.com/40'}" alt="User">
                    <div class="chat-info" onclick="selectPrivateChat('${doc.id}', '${otherUser.displayName}', '${otherUserId}')">
                        <h4>${otherUser.displayName}</h4>
                        <p id="private-last-message-${doc.id}">ยังไม่มีข้อความ</p>
                        <span id="online-status-${doc.id}" class="online-status"></span>
                    </div>
                    <div id="private-unread-${doc.id}" class="chat-unread" style="display: none;"></div>
                    <button onclick="deleteChat('private', '${doc.id}')">ลบ</button>
                `;
                privateChatList.appendChild(chatDiv);
                loadLastMessage('private', doc.id, otherUser.displayName);
                listenForNewMessages('private', doc.id);
                checkOnlineStatus(otherUserId, `online-status-${doc.id}`);
            });
        }
    });
});

// Load Last Message
function loadLastMessage(type, chatId, chatName) {
    const collection = type === 'group' ? db.collection('groups').doc(chatId).collection('messages') : db.collection('privateChats').doc(chatId).collection('messages');
    collection.orderBy('timestamp', 'desc').limit(1).onSnapshot((snapshot) => {
        const lastMessageP = document.getElementById(`${type}-last-message-${chatId}`);
        if (!lastMessageP) return;

        if (!snapshot.empty) {
            const lastMessage = snapshot.docs[0].data();
            lastMessageP.textContent = lastMessage.content ? `${lastMessage.userName}: ${lastMessage.content}` : `${lastMessage.userName}: ส่งรูปภาพ`;
        }
    });
}

// Listen for New Messages
function listenForNewMessages(type, chatId) {
    const user = auth.currentUser;
    if (!user) return;

    const collection = type === 'group' ? db.collection('groups').doc(chatId).collection('messages') : db.collection('privateChats').doc(chatId).collection('messages');
    collection.orderBy('timestamp', 'desc').limit(1).onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const message = change.doc.data();
                if (message.userId !== user.uid && (currentChatId !== chatId || currentChatType !== type)) {
                    const unreadDiv = document.getElementById(`${type}-unread-${chatId}`);
                    if (unreadDiv) {
                        let unreadCount = parseInt(unreadDiv.textContent || '0') + 1;
                        unreadDiv.textContent = unreadCount;
                        unreadDiv.style.display = 'flex';
                    }
                    alert(`ข้อความใหม่จาก ${message.userName}: ${message.content || 'ส่งรูปภาพ'}`);
                }
            }
        });
    });
}

// Select Group for Chat
function selectGroup(groupId, groupName) {
    currentGroupId = groupId;
    currentChatType = 'group';
    currentChatId = groupId;
    document.getElementById('chat-title').innerHTML = `💬 ${groupName} <button onclick="deleteChat('group', '${groupId}')">ลบแชท</button>`;
    loadGroupMessages(groupId);
    const unreadDiv = document.getElementById(`group-unread-${groupId}`);
    if (unreadDiv) {
        unreadDiv.textContent = '';
        unreadDiv.style.display = 'none';
    }
}

// Select Private Chat
function selectPrivateChat(chatId, chatName, otherUserId) {
    currentChatId = chatId;
    currentChatType = 'private';
    document.getElementById('chat-title').innerHTML = `💬 ${chatName} <span id="chat-online-status"></span> <button onclick="deleteChat('private', '${chatId}')">ลบแชท</button>`;
    loadPrivateMessages(chatId);
    checkOnlineStatus(otherUserId, 'chat-online-status');
    const unreadDiv = document.getElementById(`private-unread-${chatId}`);
    if (unreadDiv) {
        unreadDiv.textContent = '';
        unreadDiv.style.display = 'none';
    }
}

// Send Message
function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const user = auth.currentUser;

    if (!user) {
        alert("กรุณาล็อกอินก่อนส่งข้อความ");
        return;
    }

    if (!currentChatId && !currentGroupId) {
        alert("กรุณาเลือกแชทก่อนส่งข้อความ");
        return;
    }

    if (chatInput.value.trim() === '') {
        alert("กรุณาใส่ข้อความ");
        return;
    }

    const messageData = {
        content: chatInput.value,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (currentChatType === 'group') {
        db.collection('groups').doc(currentGroupId).collection('messages').add(messageData)
            .then(() => {
                chatInput.value = '';
            }).catch((error) => {
                console.error("Error sending message:", error);
                alert("เกิดข้อผิดพลาดในการส่งข้อความ: " + error.message);
            });
    } else if (currentChatType === 'private') {
        db.collection('privateChats').doc(currentChatId).collection('messages').add(messageData)
            .then(() => {
                chatInput.value = '';
            }).catch((error) => {
                console.error("Error sending message:", error);
                alert("เกิดข้อผิดพลาดในการส่งข้อความ: " + error.message);
            });
    }
}

// Send Image in Chat
function sendImageInChat() {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนส่งรูปภาพ");
        return;
    }

    if (!currentChatId && !currentGroupId) {
        alert("กรุณาเลือกแชทก่อนส่งรูปภาพ");
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storageRef = storage.ref(`chatImages/${currentChatId || currentGroupId}/${Date.now()}_${file.name}`);
        storageRef.put(file).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                const messageData = {
                    content: '',
                    imageURL: downloadURL,
                    userId: user.uid,
                    userName: user.displayName,
                    userPhoto: user.photoURL || '',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                const collection = currentChatType === 'group' ? 
                    db.collection('groups').doc(currentGroupId).collection('messages') : 
                    db.collection('privateChats').doc(currentChatId).collection('messages');

                collection.add(messageData).catch((error) => {
                    console.error("Error sending image:", error);
                    alert("เกิดข้อผิดพลาดในการส่งรูปภาพ: " + error.message);
                });
            });
        });
    };
    fileInput.click();
}

// Load Group Messages
function loadGroupMessages(groupId) {
    const chatDiv = document.getElementById('chat');
    if (!chatDiv) return;

    const user = auth.currentUser;
    if (!user) return;

    db.collection('groups').doc(groupId).collection('messages').orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            chatDiv.innerHTML = '';
            snapshot.forEach((doc) => {
                const message = doc.data();
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('chat-message');
                if (message.userId === user.uid) {
                    messageDiv.classList.add('self');
                }
                messageDiv.innerHTML = `
                    <img src="${message.userPhoto || 'https://via.placeholder.com/40'}" alt="Profile">
                    <div class="message-content">
                        <p><strong>${message.userName}</strong></p>
                        ${message.content ? `<p>${message.content}</p>` : ''}
                        ${message.imageURL ? `<img src="${message.imageURL}" alt="Chat Image" style="max-width: 200px; border-radius: 10px;">` : ''}
                    </div>
                `;
                chatDiv.appendChild(messageDiv);
            });
            chatDiv.scrollTop = chatDiv.scrollHeight;
        });
}

// Load Private Messages
function loadPrivateMessages(chatId) {
    const chatDiv = document.getElementById('chat');
    if (!chatDiv) return;

    const user = auth.currentUser;
    if (!user) return;

    db.collection('privateChats').doc(chatId).collection('messages').orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            chatDiv.innerHTML = '';
            snapshot.forEach((doc) => {
                const message = doc.data();
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('chat-message');
                if (message.userId === user.uid) {
                    messageDiv.classList.add('self');
                }
                messageDiv.innerHTML = `
                    <img src="${message.userPhoto || 'https://via.placeholder.com/40'}" alt="Profile">
                    <div class="message-content">
                        <p><strong>${message.userName}</strong></p>
                        ${message.content ? `<p>${message.content}</p>` : ''}
                        ${message.imageURL ? `<img src="${message.imageURL}" alt="Chat Image" style="max-width: 200px; border-radius: 10px;">` : ''}
                    </div>
                `;
                chatDiv.appendChild(messageDiv);
            });
            chatDiv.scrollTop = chatDiv.scrollHeight;
        });
}

// Start Chat with User
function startChatWithUser(otherUserId) {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนเริ่มแชท");
        return;
    }

    if (otherUserId === user.uid) {
        alert("คุณไม่สามารถแชทกับตัวเองได้");
        return;
    }

    db.collection('privateChats')
        .where('participants', 'array-contains', user.uid)
        .get().then((snapshot) => {
            let chatExists = false;
            let chatId = null;
            snapshot.forEach((doc) => {
                const chat = doc.data();
                if (chat.participants.includes(otherUserId)) {
                    chatExists = true;
                    chatId = doc.id;
                }
            });

            if (chatExists) {
                window.location.href = `chat.html?chatId=${chatId}`;
            } else {
                db.collection('privateChats').add({
                    participants: [user.uid, otherUserId],
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then((docRef) => {
                    window.location.href = `chat.html?chatId=${docRef.id}`;
                }).catch((error) => {
                    console.error("Error starting chat:", error);
                    alert("เกิดข้อผิดพลาดในการเริ่มแชท: " + error.message);
                });
            }
        });
}

// Delete Chat
function deleteChat(type, chatId) {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแชทนี้?")) {
        const collection = type === 'group' ? db.collection('groups') : db.collection('privateChats');
        collection.doc(chatId).delete().then(() => {
            console.log("ลบแชทสำเร็จ");
            currentChatId = null;
            currentChatType = null;
            currentGroupId = null;
            document.getElementById('chat-title').textContent = '💬 เลือกแชท';
            document.getElementById('chat').innerHTML = '';
        }).catch((error) => {
            console.error("Error deleting chat:", error);
            alert("เกิดข้อผิดพลาดในการลบแชท: " + error.message);
        });
    }
}

// Check Online Status
function checkOnlineStatus(userId, elementId) {
    db.collection('users').doc(userId).onSnapshot((doc) => {
        const statusElement = document.getElementById(elementId);
        if (doc.exists && statusElement) {
            const userData = doc.data();
            statusElement.textContent = userData.online ? 'ออนไลน์' : 'ออฟไลน์';
            statusElement.style.color = userData.online ? '#00ff00' : '#ff0000';
        }
    });
}

// Update Online Status
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).update({
            online: true,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.addEventListener('beforeunload', () => {
            db.collection('users').doc(user.uid).update({
                online: false,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }
});

// Update Profile
function updateProfile() {
    const statusInput = document.getElementById('status-input');
    const profilePicInput = document.getElementById('profile-pic-input');
    const user = auth.currentUser;

    if (!user) {
        alert("กรุณาล็อกอินก่อนอัปเดตโปรไฟล์");
        return;
    }

    const updates = {
        displayName: user.displayName,
        status: statusInput ? statusInput.value : ''
    };

    if (profilePicInput && profilePicInput.files[0]) {
        const file = profilePicInput.files[0];
        const storageRef = storage.ref(`profiles/${user.uid}/profile-pic`);
        storageRef.put(file).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                updates.photoURL = downloadURL;
                user.updateProfile({ photoURL: downloadURL }).then(() => {
                    db.collection('users').doc(user.uid).set(updates, { merge: true }).then(() => {
                        loadProfile();
                    });
                });
            }).catch((error) => {
                console.error("Error getting download URL:", error);
                alert("เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์: " + error.message);
            });
        }).catch((error) => {
            console.error("Error uploading profile picture:", error);
            alert("เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์: " + error.message);
        });
    } else {
        db.collection('users').doc(user.uid).set(updates, { merge: true }).then(() => {
            loadProfile();
        });
    }
}

// Load Profile
function loadProfile() {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user logged in, redirecting to login");
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewedUserId = urlParams.get('userId') || user.uid;
    const isOwnProfile = viewedUserId === user.uid;

    console.log("Loading profile for user:", viewedUserId, "Is own profile:", isOwnProfile);

    const profilePic = document.getElementById('profile-pic');
    const profileName = document.getElementById('profile-name');
    const profileStatus = document.getElementById('profile-status');
    const followersCount = document.getElementById('followers-count');
    const followingCount = document.getElementById('following-count');
    const postsCount = document.getElementById('posts-count');
    const profileActions = document.getElementById('profile-actions');

    if (!profilePic || !profileName || !profileStatus || !followersCount || !followingCount || !postsCount || !profileActions) {
        console.error("Profile elements not found in DOM");
        return;
    }

    db.collection('users').doc(viewedUserId).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            console.log("Profile data:", data);
            profilePic.src = data.photoURL || 'https://via.placeholder.com/100';
            profileName.textContent = data.displayName || 'ผู้ใช้';
            profileStatus.textContent = data.status || '';
            followersCount.textContent = (data.followers || []).length;
            followingCount.textContent = (data.following || []).length;

            db.collection('posts').where('userId', '==', viewedUserId).get().then((snapshot) => {
                postsCount.textContent = snapshot.size;
            }).catch((error) => {
                console.error("Error loading posts count:", error);
            });

            if (isOwnProfile) {
                profileActions.innerHTML = `
                    <button onclick="updateProfile()" id="edit-profile-btn">แก้ไขโปรไฟล์</button>
                `;
            } else {
                profileActions.innerHTML = `
                    <button onclick="startChatWithUser('${viewedUserId}')">แชท</button>
                `;
            }
        } else {
            console.log("User document does not exist, initializing for viewedUserId:", viewedUserId);
            profilePic.src = 'https://via.placeholder.com/100';
            profileName.textContent = 'ผู้ใช้';
            profileStatus.textContent = '';
            followersCount.textContent = '0';
            followingCount.textContent = '0';
            postsCount.textContent = '0';

            if (isOwnProfile) {
                db.collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    photoURL: user.photoURL || '',
                    status: '',
                    followers: [],
                    following: [],
                    online: false
                }, { merge: true }).then(() => {
                    console.log("User document initialized for:", user.uid);
                }).catch((error) => {
                    console.error("Error initializing user document:", error);
                });
            } else {
                console.error("Profile not found for user:", viewedUserId);
                alert("ไม่พบโปรไฟล์ของผู้ใช้");
            }
        }
    }, (error) => {
        console.error("Error loading profile:", error);
        alert("เกิดข้อผิดพลาดในการโหลดโปรไฟล์: " + error.message);
    });

    const userPosts = document.getElementById('user-posts');
    if (userPosts) {
        db.collection('posts').where('userId', '==', viewedUserId).orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                userPosts.innerHTML = '';
                snapshot.forEach((doc) => {
                    const post = doc.data();
                    const isOwnPost = user && post.userId === user.uid;
                    const postDiv = document.createElement('div');
                    postDiv.classList.add('post-item');
                    postDiv.innerHTML = `
                        <div class="post-header">
                            <div class="user-info">
                                <img src="${post.userPhoto || 'https://via.placeholder.com/32'}" alt="Profile">
                                <p onclick="goToProfile('${post.userId}')">${post.userName}</p>
                            </div>
                            ${isOwnPost ? `<button class="delete-post" onclick="deletePost('${doc.id}')"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post Image" class="post-image">` : ''}
                        <div class="post-actions">
                            <button onclick="likePost('${doc.id}')"><i class="far fa-heart"></i></button>
                            <button onclick="alert('ฟังก์ชันแชร์ยังไม่พร้อมใช้งาน')"><i class="far fa-paper-plane"></i></button>
                        </div>
                        <div class="post-stats">
                            <p>${post.likes ? post.likes.length : 0} ถูกใจ</p>
                            <p>${post.commentsCount || 0} ความคิดเห็น</p>
                        </div>
                        <div class="post-content">
                            <p><strong>${post.userName}</strong> ${post.content}</p>
                        </div>
                    `;
                    userPosts.appendChild(postDiv);
                });
            }, (error) => {
                console.error("Error loading user posts:", error);
            });
    }

    const friendSearchSection = document.querySelector('h2:nth-of-type(2)');
    const friendsListSection = document.querySelector('h2:nth-of-type(3)');
    if (!isOwnProfile) {
        friendSearchSection.style.display = 'none';
        friendsListSection.style.display = 'none';
        document.getElementById('friend-search').style.display = 'none';
        document.querySelector('button[onclick="searchUsers()"]').style.display = 'none';
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('friends-list').style.display = 'none';
    }
}

// Search Users
function searchUsers() {
    const searchInput = document.getElementById('friend-search').value;
    const searchResults = document.getElementById('search-results');

    db.collection('users').where('displayName', '>=', searchInput)
        .where('displayName', '<=', searchInput + '\uf8ff')
        .get().then((snapshot) => {
            searchResults.innerHTML = '';
            snapshot.forEach((doc) => {
                const user = doc.data();
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('search-result');
                resultDiv.innerHTML = `
                    <span>${user.displayName}</span>
                    <button onclick="addFriend('${doc.id}')">เพิ่มเพื่อน</button>
                `;
                searchResults.appendChild(resultDiv);
            });
        });
}

// Add Friend
function addFriend(friendId) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).update({
        following: firebase.firestore.FieldValue.arrayUnion(friendId)
    });

    db.collection('users').doc(friendId).update({
        followers: firebase.firestore.FieldValue.arrayUnion(user.uid)
    });
}

// Load Friends
function loadFriends() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).onSnapshot((doc) => {
        const friendsList = document.getElementById('friends-list');
        if (!doc.exists || !friendsList) return;

        const following = doc.data().following || [];
        friendsList.innerHTML = '';
        following.forEach((friendId) => {
            db.collection('users').doc(friendId).get().then((friendDoc) => {
                const friend = friendDoc.data();
                const friendDiv = document.createElement('div');
                friendDiv.classList.add('friend-item');
                friendDiv.innerHTML = `
                    <span>${friend.displayName}</span>
                    <button onclick="goToProfile('${friendId}')">ดูโปรไฟล์</button>
                    <button onclick="startChatWithUser('${friendId}')">แชท</button>
                `;
                friendsList.appendChild(friendDiv);
            });
        });
    });
}
// Add Comment
function addComment(postId) {
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาล็อกอินก่อนแสดงความคิดเห็น");
        return;
    }

    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (!commentInput || commentInput.value.trim() === '') {
        alert("กรุณาใส่ความคิดเห็น");
        return;
    }

    const commentData = {
        content: commentInput.value,
        userId: user.uid,
        userName: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: []
    };

    console.log("Adding comment to post:", postId, commentData); // เพิ่มการดีบัก

    db.collection('posts').doc(postId).collection('comments').add(commentData)
        .then(() => {
            console.log("Comment added successfully");
            commentInput.value = '';
            db.collection('posts').doc(postId).update({
                commentsCount: firebase.firestore.FieldValue.increment(1)
            }).catch((error) => {
                console.error("Error updating commentsCount:", error);
                alert("เกิดข้อผิดพลาดในการอัปเดตจำนวนความคิดเห็น: " + error.message);
            });
        }).catch((error) => {
            console.error("Error adding comment:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น: " + error.message);
        });
}

function goToProfile(userId) {
    console.log("Navigating to profile for user:", userId);
    window.location.href = `profile.html?userId=${userId}`;
}
