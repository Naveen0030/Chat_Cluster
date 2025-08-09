# Chat Cluster 💬

A real-time chat application built with Node.js, Express, Socket.IO, and vanilla JavaScript. Features user authentication, friend system, and instant messaging with modern UI/UX.

![Chat Cluster](https://img.shields.io/badge/Chat-Cluster-green?style=for-the-badge&logo=whatsapp)

## 🚀 Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **User Authentication** - Secure login and registration system
- **Friend System** - Add friends, send/accept friend requests
- **Online Status** - See when friends are online or last seen
- **Typing Indicators** - Real-time typing status
- **Modern UI** - Clean, responsive WhatsApp-inspired design
- **Toast Notifications** - User-friendly feedback system
- **Message History** - Persistent chat history
- **Search Users** - Find users by username or email

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database (assumed)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - Real-time client
- **CSS3** - Modern styling with animations
- **Font Awesome** - Icons
- **HTML5** - Semantic markup

## 📁 Project Structure

```
chat-cluster/
├── backend/
│   └── index.js                 # Express server & Socket.IO setup
├── frontend/
│   ├── index.html              # Main HTML structure
│   ├── style.css               # Styling and animations
│   └── js/
│       ├── config.js           # Configuration & global variables
│       ├── utils.js            # Utility functions
│       ├── socket.js           # Socket.IO event handlers
│       ├── auth.js             # Authentication logic
│       ├── friends.js          # Friend management
│       ├── chat.js             # Chat functionality
│       └── app.js              # Application initialization
└── README.md                   # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Naveen0030/chat-cluster.git
   cd chat-cluster
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chatcluster
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Serve the frontend**
   - Open `frontend/index.html` in a web browser, or
   - Use a local server (recommended):
   ```bash
   # Using Python
   cd frontend
   python -m http.server 8080
   
   # Using Node.js
   npx http-server frontend -p 8080
   
   # Using VS Code Live Server extension
   ```

6. **Access the application**
   - Frontend: `http://localhost:8080`
   - Backend API: `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration (`backend/index.js`)
```javascript
// Server configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatcluster';
```

### Frontend Configuration (`frontend/js/config.js`)
```javascript
// API endpoint configuration
window.API_BASE = "http://localhost:3000";
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User login
- `GET /api/me` - Get current user info

### Friends
- `GET /api/friends` - Get user's friends list
- `GET /api/friends/requests` - Get pending friend requests
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/reject` - Reject friend request

### Messages
- `GET /api/messages/:friendId` - Get chat history
- `POST /api/messages` - Send message (via Socket.IO)

### Users
- `GET /api/users/search` - Search users by username/email

## 🔌 Socket.IO Events

### Client → Server
- `authenticate` - Authenticate socket connection
- `send-message` - Send a message
- `typing` - Typing indicator
- `mark-messages-read` - Mark messages as read

### Server → Client
- `authenticated` - Authentication successful
- `authentication-error` - Authentication failed
- `new-message` - Receive new message
- `message-sent` - Message sent confirmation
- `user-typing` - User typing status
- `friend-online` - Friend came online
- `friend-offline` - Friend went offline
- `friend-request` - New friend request
- `friend-accepted` - Friend request accepted

## 🎨 UI Components

### Authentication
- Login form with email/password
- Registration form with username/email/password
- Password visibility toggle
- Form validation and error handling

### Main Interface
- **Sidebar**: Friends list, search, add friend button
- **Chat Area**: Message history, typing indicators, message input
- **Header**: User info, online status, logout button

### Modals
- Add Friend modal with user search
- Friend Requests modal with accept/reject actions

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- XSS prevention with HTML escaping

## 🚀 Performance Optimizations

- Efficient DOM manipulation
- Debounced typing indicators
- Lazy loading of chat history
- Optimized Socket.IO event handling
- CSS animations for smooth UX

### Adding New Features

1. **Backend**: Add routes to `backend/index.js`
2. **Frontend**: Create new modules in `frontend/js/`
3. **Styling**: Add styles to `frontend/style.css`
4. **Initialize**: Update `frontend/js/app.js` if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

**Made with ❤️ for real-time communication**
