console.log("APP STARTED");
console.log("JS loaded");
const toggleBtn = document.getElementById("toggleTheme");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
});
const firebaseConfig = {
  apiKey: "AIzaSyDQAqsp-jlLb5bwtRSddcClJxWE3WH9F0Q",
  authDomain: "bee-happy-7cc90.firebaseapp.com",
  projectId: "bee-happy-7cc90",
  storageBucket: "bee-happy-7cc90.firebasestorage.app",
  messagingSenderId: "735016350625",
  appId: "1:735016350625:web:cce2be75814e6b776a91e0"
};

// Initialize Firebase (compat version must be loaded in HTML)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// UI
const loginBtn = document.getElementById("login");
const sendBtn = document.getElementById("send");
const input = document.getElementById("messageInput");

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});

// LOGIN
loginBtn.onclick = function () {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("Logged in:", result.user);
    })
    .catch((error) => {
      console.log(error);
    });
};

// SHOW CHAT WHEN LOGGED IN
auth.onAuthStateChanged((user) => {
  if (user) {
    loginBtn.style.display = "none";

    db.collection("users").doc(user.uid).set({
  name: user.displayName,
  role: user.email === "beehappyprojectucd@gmail.com" ? "listener" : "user"
}, { merge: true });

  }
});

// SEND MESSAGE
sendBtn.onclick = function () {
  const input = document.getElementById("messageInput");

  console.log("currentChat =", currentChat); // DEBUG

  // ❗ BLOCK IF NO CHAT SELECTED
  if (!currentChat) {
    alert("⚠ Please click a listener first");
    return;
  }

  if (input.value.trim() !== "") {

    db.collection("chats")
      .doc(currentChat)
      .collection("messages")
      .add({
        text: input.value,
        name: auth.currentUser.displayName,
        uid: auth.currentUser.uid,
        time: Date.now()
      });

    input.value = "";
  }
};

// REAL TIME MESSAGES
function loadMessages() {
  if (!currentChat) return;

  // STOP previous listener if exists
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  unsubscribeMessages = db.collection("chats")
    .doc(currentChat)
    .collection("messages")
    .orderBy("time")
    .onSnapshot((snapshot) => {

      const list = document.getElementById("messages");
      list.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("div");
        



if (data.uid === auth.currentUser.uid) {
  li.classList.add("me");
} else {
  li.classList.add("other");
}
        const time = new Date(data.time).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit"
});

li.innerHTML = `
  <div class="msg-header">
    <span class="msg-icon">🟡</span>
    <span class="msg-name">${data.name}</span>
  </div>

  <div class="msg-bubble">
    ${data.text}
    <div class="msg-time">${time}</div>
  </div>
`;

        

      

        list.appendChild(li);
      });

      list.scrollTo({
  top: list.scrollHeight,
  behavior: "smooth"
});
    });
}
  
  
db.collection("users")
  .where("role", "==", "listener")
  .onSnapshot((snapshot) => {

    const box = document.getElementById("listeners");
    box.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const el = document.createElement("p");
      el.textContent = "🟡 " + data.name;
      el.classList.add("listener");

      

      
        el.onclick = () => {
  console.log("listener clicked:", doc.id);

  // remove active highlight from all
  document.querySelectorAll("#listeners p").forEach(p => {
    p.classList.remove("active-listener");
  });

  // add highlight to clicked one
  el.classList.add("active-listener");

  // start chat
  startChat(doc.id);
};

      box.appendChild(el);
    });

  });
  let currentChat = null;
  let unsubscribeMessages = null;

function startChat(listenerId) {
  const user1 = auth.currentUser.uid;
  const user2 = listenerId;

  // ALWAYS same order (important)
  const chatId =
    user1 < user2
      ? user1 + "_" + user2
      : user2 + "_" + user1;

  currentChat = chatId;

  console.log("CHAT ID:", currentChat);

  db.collection("chats").doc(currentChat).set({
    users: [user1, user2]
  }, { merge: true });

  loadMessages();
}
