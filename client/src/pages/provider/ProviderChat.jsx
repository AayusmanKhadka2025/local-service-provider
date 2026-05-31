import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Check,
  CheckCheck,
  MessageSquare,
  Flag,
  Ban,
  AlertTriangle,
  X,
  MoreVertical,
  Unlock,
  Clock,
} from "lucide-react";

const SOCKET_URL = "http://localhost:5050";

const ProviderChat = ({ chat: initialChat, user, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(initialChat);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showChatActions, setShowChatActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [otherReasonText, setOtherReasonText] = useState("");
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatRef = useRef(initialChat);

  const provider = JSON.parse(localStorage.getItem("provider") || "{}");
  const token = localStorage.getItem("providerToken");

  // Update ref when chat changes
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  // Check if chat is blocked by provider
  const isBlockedByProvider = chat?.isBlocked === true && chat?.blockedBy === 'provider';
  const isBlockedByUser = chat?.isBlocked === true && chat?.blockedBy === 'user';
  const isBlocked = isBlockedByProvider || isBlockedByUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("register", { userId: provider._id, userType: "provider" });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [provider._id]);

  // 2. Mark messages as read when chat is opened
  useEffect(() => {
    if (chat?._id && !loading && messages.length > 0 && !isBlocked) {
      const markMessagesAsRead = async () => {
        try {
          await axios.post(
            `http://localhost:5050/api/chat/provider/mark-read/${chat._id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (socket) {
            socket.emit("mark_read", { chatId: chat._id, userId: provider._id });
          }
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      };
      
      markMessagesAsRead();
    }
  }, [chat?._id, loading, messages.length, provider._id, socket, token, isBlocked]);

  // 3. Fetch messages
  useEffect(() => {
    if (!chat?._id) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5050/api/chat/provider/messages/${chat._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chat?._id, token]);

  // 4. Join room
  useEffect(() => {
    if (!socket || !chat?._id) return;
    console.log("Joining chat room:", chat._id);
    socket.emit("join_chat", { chatId: chat._id });
  }, [socket, chat?._id]);

  // 5. Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        // Replace optimistic message from provider
        if (message.senderId === provider._id) {
          const hasOptimistic = prev.some((m) => m._id?.toString().startsWith("temp_"));
          if (hasOptimistic) {
            return prev
              .filter((m) => !m._id?.toString().startsWith("temp_"))
              .concat(message);
          }
        }
        const exists = prev.some((m) => m._id?.toString() === message._id?.toString());
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleMessagesCleared = (data) => {
      if (data.chatId === chatRef.current?._id?.toString()) {
        setMessages([]);
      }
    };

    const handleUserTyping = (data) => {
      if (!isBlockedByProvider) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.userId === provider._id) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === provider._id && !msg.read
            ? { ...msg, read: true }
            : msg,
        ),
      );
    };

    const handleBlockStatus = (data) => {
      if (data.chatId === chatRef.current?._id?.toString()) {
        setChat(prev => ({ ...prev, isBlocked: data.isBlocked, blockedBy: data.blockedBy }));
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_cleared", handleMessagesCleared);
    socket.on("user_typing", handleUserTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("chat_block_status", handleBlockStatus);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_cleared", handleMessagesCleared);
      socket.off("user_typing", handleUserTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("chat_block_status", handleBlockStatus);
    };
  }, [socket, provider._id, isBlockedByProvider]);

  // Block chat with real-time sync
  const handleBlockChat = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5050/api/chat/provider/block/${chat._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setChat(prev => ({ ...prev, isBlocked: true, blockedBy: 'provider' }));
        setShowBlockConfirm(false);
        
        if (socket) {
          socket.emit("block_chat", { 
            chatId: chat._id, 
            blockedBy: 'provider', 
            isBlocked: true 
          });
        }
      }
    } catch (error) {
      console.error("Error blocking chat:", error);
    } finally {
      setActionLoading(false);
      setShowChatActions(false);
    }
  };

  // Unblock chat
  const handleUnblockChat = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5050/api/chat/provider/unblock/${chat._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setChat(prev => ({ ...prev, isBlocked: false, blockedBy: null }));
        setShowUnblockConfirm(false);
        
        if (socket) {
          socket.emit("block_chat", { 
            chatId: chat._id, 
            blockedBy: null, 
            isBlocked: false 
          });
        }
      }
    } catch (error) {
      console.error("Error unblocking chat:", error);
    } finally {
      setActionLoading(false);
      setShowChatActions(false);
    }
  };

  // Report chat
  const handleReportChat = async () => {
    const finalReason = reportReason === "other" ? otherReasonText : reportReason;
    
    if (!finalReason || finalReason.trim() === "") {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5050/api/chat/provider/report/${chat._id}`,
        { reason: finalReason, details: reportDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setShowReportModal(false);
        setReportReason("");
        setReportDetails("");
        setOtherReasonText("");
      }
    } catch (error) {
      console.error("Error reporting chat:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const reportReasons = [
    { value: "harassment", label: "Harassment or abusive behavior" },
    { value: "spam", label: "Spam or unsolicited messages" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "scam", label: "Suspected scam or fraud" },
    { value: "other", label: "Other" },
  ];

  // Send message with optimistic update
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !chat?._id || !socket || isBlocked) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    // Optimistic update
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      chatId: chat._id,
      senderId: provider._id,
      senderType: "provider",
      receiverId: user._id,
      receiverType: "user",
      message: messageContent,
      messageType: "text",
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    socket.emit("send_message", {
      chatId: chat._id,
      senderId: provider._id,
      senderType: "provider",
      receiverId: user._id,
      receiverType: "user",
      message: messageContent,
      messageType: "text",
      providerName: `${provider.firstName} ${provider.lastName}`,
      providerAvatar: provider.profileImage,
      userName: user.name,
    });

    setSending(false);
  }, [newMessage, sending, chat, provider, user._id, user.name, socket, isBlocked]);

  const handleTyping = useCallback(
    (e) => {
      setNewMessage(e.target.value);

      if (!isTyping && chat?._id && !isBlocked) {
        setIsTyping(true);
        socket?.emit("typing", {
          chatId: chat._id,
          userId: provider._id,
          isTyping: true,
        });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && chat?._id && !isBlocked) {
          setIsTyping(false);
          socket.emit("typing", {
            chatId: chat._id,
            userId: provider._id,
            isTyping: false,
          });
        }
      }, 1000);
    },
    [isTyping, chat, socket, provider._id, isBlocked],
  );

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !chat?._id || !socket || isBlocked) return;

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "http://localhost:5050/api/chat/provider/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          const optimisticMediaMessage = {
            _id: `temp_${Date.now()}`,
            chatId: chat._id,
            senderId: provider._id,
            senderType: "provider",
            receiverId: user._id,
            receiverType: "user",
            message: "",
            messageType: response.data.fileType,
            mediaUrl: response.data.fileUrl,
            read: false,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, optimisticMediaMessage]);
          scrollToBottom();

          socket.emit("send_message", {
            chatId: chat._id,
            senderId: provider._id,
            senderType: "provider",
            receiverId: user._id,
            receiverType: "user",
            message: "",
            messageType: response.data.fileType,
            mediaUrl: response.data.fileUrl,
            providerName: `${provider.firstName} ${provider.lastName}`,
            providerAvatar: provider.profileImage,
            userName: user.name,
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [chat, socket, provider, user._id, user.name, token, isBlocked],
  );

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) return "Today";
    if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return msgDate.toLocaleDateString();
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Report Chat</h3>
                  <p className="text-orange-100 text-sm mt-1">Please tell us why you're reporting this conversation</p>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for reporting</label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <label key={reason.value} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="reportReason" value={reason.value} checked={reportReason === reason.value} onChange={(e) => setReportReason(e.target.value)} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-gray-700">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {reportReason === "other" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Please specify</label>
                  <textarea rows="2" value={otherReasonText} onChange={(e) => setOtherReasonText(e.target.value)} placeholder="Describe why you're reporting this chat..." className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none" />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional details (Optional)</label>
                <textarea rows="3" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Provide any additional context..." className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleReportChat} disabled={actionLoading} className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Flag className="w-4 h-4" /> Submit Report</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${user.name}&background=ffffff&color=3b82f6&size=80`
            }
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
            alt={user.name}
          />
          <div>
            <h3 className="font-semibold text-white">{user.name}</h3>
            <p className="text-xs text-blue-100">{user.email}</p>
          </div>
        </div>

        {/* Chat Actions Menu */}
        <div className="relative">
          <button onClick={() => setShowChatActions(!showChatActions)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <MoreVertical className="w-5 h-5" />
          </button>
          {showChatActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
              {isBlockedByProvider ? (
                <button onClick={() => setShowUnblockConfirm(true)} className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition">
                  <Unlock className="w-4 h-4" /> Unblock Chat
                </button>
              ) : (
                <button onClick={() => setShowBlockConfirm(true)} className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition">
                  <Ban className="w-4 h-4" /> Block Chat
                </button>
              )}
              <button onClick={() => { setShowChatActions(false); setShowReportModal(true); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition">
                <Flag className="w-4 h-4" /> Report Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-delete Info Banner */}
      {messages.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-center gap-2">
          <Clock className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-500">
            Messages are automatically deleted after 7 days
          </span>
        </div>
      )}

      {/* Blocked/Unblock Status Banner */}
      {isBlockedByProvider && (
        <div className="bg-orange-50 border-b border-orange-200 p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Ban className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">You have blocked this conversation. You cannot send new messages.</span>
            <button 
              onClick={() => setShowUnblockConfirm(true)}
              className="ml-2 text-sm text-orange-600 font-medium hover:text-orange-700 underline"
            >
              Unblock
            </button>
          </div>
        </div>
      )}

      {isBlockedByUser && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Ban className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">This conversation has been blocked. You cannot send new messages.</span>
          </div>
        </div>
      )}

      {/* Block Confirmation Banner */}
      {showBlockConfirm && !isBlocked && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Block this conversation?</p>
              <p className="text-xs text-yellow-700 mt-1">You will not be able to send or receive messages from this person. Your existing messages will remain visible.</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleBlockChat}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : "Yes, Block"}
                </button>
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button onClick={() => setShowBlockConfirm(false)} className="text-yellow-600 hover:text-yellow-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Unblock Confirmation Banner */}
      {showUnblockConfirm && isBlockedByProvider && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-start gap-3">
            <Unlock className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Unblock this conversation?</p>
              <p className="text-xs text-green-700 mt-1">You will be able to send and receive messages again.</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleUnblockChat}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : "Yes, Unblock"}
                </button>
                <button
                  onClick={() => setShowUnblockConfirm(false)}
                  className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button onClick={() => setShowUnblockConfirm(false)} className="text-green-600 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No messages yet
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {isBlocked ? "You cannot send messages in this conversation." : `Send a message to ${user.name} to start the conversation.`}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {dateMessages.map((message) => {
                const isSender = message.senderId === provider._id;
                const isOptimistic = message._id?.toString().startsWith("temp_");
                return (
                  <div
                    key={message._id}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3 ${isOptimistic ? "opacity-70" : ""}`}
                  >
                    <div
                      className={`max-w-[70%] ${isSender ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${isSender ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}
                      >
                        {message.messageType === "text" && (
                          <p className="text-sm break-words">
                            {message.message}
                          </p>
                        )}
                        {message.messageType === "image" && (
                          <img
                            src={message.mediaUrl}
                            alt="Shared image"
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                            onClick={() =>
                              window.open(message.mediaUrl, "_blank")
                            }
                          />
                        )}
                        {message.messageType === "video" && (
                          <video
                            src={message.mediaUrl}
                            controls
                            className="max-w-full rounded-lg"
                            controlsList="nodownload"
                          />
                        )}
                        <div
                          className={`text-xs mt-1 flex items-center justify-end gap-1 ${isSender ? "text-blue-200" : "text-gray-400"}`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {isSender &&
                            (message.read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                          {isOptimistic && (
                            <span className="ml-1 text-xs text-gray-400">Sending...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isSender && (
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff&size=80`
                        }
                        className="w-8 h-8 rounded-full object-cover mx-2 order-0"
                        alt={user.name}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {otherUserTyping && !isBlockedByProvider && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
            <div className="bg-gray-100 rounded-full px-3 py-1">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-75">.</span>
                <span className="animate-bounce delay-150">.</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className={`flex items-center gap-2 ${isBlocked ? "opacity-50" : ""}`}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            disabled={isBlocked}
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            disabled={uploading || isBlocked}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 bg-white rounded-lg shadow-lg border p-2 z-10">
              <div className="grid grid-cols-8 gap-1">
                {[
                  "😊","😂","❤️","👍","🎉","🔥","👏","🙏",
                  "😢","😡","🥳","💪","👋","✅","⭐","💯",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl hover:bg-gray-100 p-1 rounded transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder={isBlocked ? "Conversation blocked - cannot send messages" : "Type a message..."}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={uploading || isBlocked}
          />

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || isBlocked}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderChat;