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
} from "lucide-react";

const SOCKET_URL = "http://localhost:5050";

const UserChat = ({ booking, provider, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Initialize socket connection only
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("register", { userId: user._id, userType: "user" });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  // 2. Fetch chat data — no socket dependency here
  useEffect(() => {
    const initializeChat = async () => {
      if (!user._id || !provider._id) return;

      try {
        setLoading(true);

        const response = await axios.post(
          "http://localhost:5050/api/chat/get-or-create",
          {
            bookingId: booking?._id,
            providerId: provider._id,
            providerName: provider.name,
            providerAvatar: provider.avatar,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.success && response.data.chat) {
          const chatData = response.data.chat;
          setChat(chatData);

          const messagesResponse = await axios.get(
            `http://localhost:5050/api/chat/messages/${chatData._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (messagesResponse.data.success) {
            setMessages(messagesResponse.data.messages);
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [booking?._id, provider._id, user._id, token]);

  // 3. Join room reactively — fires whenever BOTH socket AND chat become available
  useEffect(() => {
    if (!socket || !chat?._id) return;
    console.log("Joining chat room:", chat._id);
    socket.emit("join_chat", { chatId: chat._id });
  }, [socket, chat?._id]);

  // 4. Socket event listeners
  useEffect(() => {
    if (!socket || !chat) return;

    const handleNewMessage = (message) => {
      if (message.chatId !== chat._id) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleUserTyping = (data) => {
      if (data.userId === provider._id) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.userId === user._id) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === user._id && !msg.read
            ? { ...msg, read: true }
            : msg,
        ),
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, chat, provider._id, user._id]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !chat?._id || !socket) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    socket.emit("send_message", {
      chatId: chat._id,
      senderId: user._id,
      senderType: "user",
      receiverId: provider._id,
      receiverType: "provider",
      message: messageContent,
      messageType: "text",
      senderName: user.name,
      providerName: provider.name,
      providerAvatar: provider.avatar,
      bookingId: booking?._id,
    });

    setSending(false);
  }, [
    newMessage,
    sending,
    chat,
    user._id,
    provider._id,
    socket,
    user.name,
    provider.name,
    provider.avatar,
    booking?._id,
  ]);

  const handleTyping = useCallback(
    (e) => {
      setNewMessage(e.target.value);

      if (!isTyping && chat?._id) {
        setIsTyping(true);
        socket?.emit("typing", {
          chatId: chat._id,
          userId: user._id,
          isTyping: true,
        });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && chat?._id) {
          setIsTyping(false);
          socket.emit("typing", {
            chatId: chat._id,
            userId: user._id,
            isTyping: false,
          });
        }
      }, 1000);
    },
    [isTyping, chat, socket, user._id],
  );

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !chat?._id || !socket) return;

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "http://localhost:5050/api/chat/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          socket.emit("send_message", {
            chatId: chat._id,
            senderId: user._id,
            senderType: "user",
            receiverId: provider._id,
            receiverType: "provider",
            message: "",
            messageType: response.data.fileType,
            mediaUrl: response.data.fileUrl,
            senderName: user.name,
            providerName: provider.name,
            providerAvatar: provider.avatar,
            bookingId: booking?._id,
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [
      chat,
      socket,
      user._id,
      provider._id,
      user.name,
      provider.name,
      provider.avatar,
      token,
      booking?._id,
    ],
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
              provider.avatar ||
              `https://ui-avatars.com/api/?name=${provider.name}&background=ffffff&color=3b82f6&size=80`
            }
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
            alt={provider.name}
          />
          <div>
            <h3 className="font-semibold text-white">{provider.name}</h3>
            <p className="text-xs text-blue-100">{provider.category}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No messages yet
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Send a message to {provider.name} to start the conversation.
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
                const isSender = message.senderId === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3`}
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
                        </div>
                      </div>
                    </div>
                    {!isSender && (
                      <img
                        src={
                          provider.avatar ||
                          `https://ui-avatars.com/api/?name=${provider.name}&background=3b82f6&color=fff&size=80`
                        }
                        className="w-8 h-8 rounded-full object-cover mx-2 order-0"
                        alt={provider.name}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {otherUserTyping && (
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            disabled={uploading}
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
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserChat;