const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://ui-avatars.com"]
    }
  }
}));

app.use(cors({
  origin: function (origin, callback) { // here
    if (!origin || origin.startsWith("https://chat-cluster-nx7s.vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));



app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${this.username}&background=random&size=200`;
    }
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// FIXED JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // FIXED: Properly assign the decoded user information
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    
    console.log('Authenticated user:', req.user); // Debug log
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('username email avatar status').limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/friends/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('friendRequests.from', 'username email avatar');

    res.json(user.friendRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

app.post('/api/friends/request', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user.userId);
    const isAlreadyFriend = currentUser.friends.some(
      friend => friend.user.toString() === userId
    );

    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already sent
    const requestExists = targetUser.friendRequests.some(
      request => request.from.toString() === req.user.userId
    );

    if (requestExists) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({ from: req.user.userId });
    await targetUser.save();

    // Emit to target user if online
    const targetSocket = connectedUsers.get(userId);
    if (targetSocket) {
      io.to(targetSocket).emit('friend-request', {
        from: {
          id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar
        }
      });
    }

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/friends/accept', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    const currentUser = await User.findById(req.user.userId);
    const requesterUser = await User.findById(userId);

    if (!requesterUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove friend request
    currentUser.friendRequests = currentUser.friendRequests.filter(
      request => request.from.toString() !== userId
    );

    // Add to friends list
    currentUser.friends.push({ user: userId });
    requesterUser.friends.push({ user: req.user.userId });

    await currentUser.save();
    await requesterUser.save();

    // Emit to both users
    const requesterSocket = connectedUsers.get(userId);
    if (requesterSocket) {
      io.to(requesterSocket).emit('friend-accepted', {
        user: {
          id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          status: currentUser.status
        }
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/friends/reject', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user.userId);

    currentUser.friendRequests = currentUser.friendRequests.filter(
      req => req.from.toString() !== userId
    );

    await currentUser.save();
    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Error rejecting friend request' });
  }
});

app.get('/api/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('friends.user', 'username email avatar status lastSeen');

    const friends = user.friends.map(friend => ({
      id: friend.user._id,
      username: friend.user.username,
      email: friend.user.email,
      avatar: friend.user.avatar,
      status: friend.user.status,
      lastSeen: friend.user.lastSeen,
      addedAt: friend.addedAt
    }));

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FIXED: Messages endpoint with proper validation
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // FIXED: Validate that req.user.userId exists
    if (!req.user.userId) {
      console.error('No userId in authenticated request');
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // FIXED: Validate userId parameter
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    console.log(`Loading messages between ${req.user.userId} and ${userId}`); // Debug log

    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: userId },
        { sender: userId, receiver: req.user.userId }
      ]
    })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.io connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      socket.userId = decoded.userId;
      connectedUsers.set(decoded.userId, socket.id);

      console.log(`User authenticated: ${decoded.username} (${decoded.userId})`); // Debug log

      // Update user status
      await User.findByIdAndUpdate(decoded.userId, {
        status: 'online',
        lastSeen: new Date()
      });

      socket.emit('authenticated', { success: true });
      
      // Notify friends
      const user = await User.findById(decoded.userId).populate('friends.user');
      user.friends.forEach(friend => {
        const friendSocket = connectedUsers.get(friend.user._id.toString());
        if (friendSocket) {
          io.to(friendSocket).emit('friend-online', {
            userId: decoded.userId,
            status: 'online'
          });
        }
      });

    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authentication-error', { error: 'Invalid token' });
    }
  });

  socket.on('send-message', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { receiverId, content, messageType = 'text' } = data;

      // Validate message
      if (!content || !receiverId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // FIXED: Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        socket.emit('error', { message: 'Invalid receiver ID' });
        return;
      }

      console.log(`Message from ${socket.userId} to ${receiverId}: ${content}`); // Debug log

      // Create message
      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content,
        messageType
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Send to receiver if online
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('new-message', {
          _id: message._id,
          content: message.content,
          messageType: message.messageType,
          sender: message.sender,
          receiver: message.receiver,
          createdAt: message.createdAt,
          isRead: false
        });
      }

      // Confirm to sender
      socket.emit('message-sent', {
        _id: message._id,
        content: message.content,
        messageType: message.messageType,
        sender: message.sender,
        receiver: message.receiver,
        createdAt: message.createdAt
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    if (!socket.userId) return;
    
    const { receiverId, isTyping } = data;
    const receiverSocket = connectedUsers.get(receiverId);
    
    if (receiverSocket) {
      io.to(receiverSocket).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  socket.on('mark-messages-read', async (data) => {
    try {
      if (!socket.userId) return;

      const { senderId } = data;

      if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
        console.warn('Invalid or missing senderId in mark-messages-read:', senderId);
        return;
      }

      console.log(`Marking messages read from ${senderId} to ${socket.userId}`); // Debug log

      const result = await Message.updateMany(
        {
          sender: senderId,
          receiver: socket.userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      console.log(`Marked ${result.modifiedCount} messages as read`); // Debug log

      // Notify sender
      const senderSocket = connectedUsers.get(senderId);
      if (senderSocket) {
        io.to(senderSocket).emit('messages-read', {
          readBy: socket.userId
        });
      }

    } catch (error) {
      console.error('Mark messages read error:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user status
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Notify friends
      try {
        const user = await User.findById(socket.userId).populate('friends.user');
        if (user) {
          user.friends.forEach(friend => {
            const friendSocket = connectedUsers.get(friend.user._id.toString());
            if (friendSocket) {
              io.to(friendSocket).emit('friend-offline', {
                userId: socket.userId,
                status: 'offline',
                lastSeen: new Date()
              });
            }
          });
        }
      } catch (error) {
        console.error('Error notifying friends of disconnect:', error);
      }
    }
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Chat Cluster Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to use the app`);
});
