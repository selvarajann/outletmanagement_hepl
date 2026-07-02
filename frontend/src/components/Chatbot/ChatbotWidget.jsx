import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  Fade,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import chatbotService from "../../services/chatbotService";
import { C } from "../../theme/colors";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const res = await chatbotService.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadConversation = async (id) => {
    setIsLoading(true);
    try {
      const res = await chatbotService.getConversation(id);
      setCurrentConversationId(res.data.id);
      setMessages(res.data.messages || []);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Failed to load conversation", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestions([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await chatbotService.deleteConversation(id);
      if (currentConversationId === id) {
        handleNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleSendMessage = async (textOverride) => {
    const isString = typeof textOverride === "string";
    const textToSend = isString ? textOverride : inputValue;
    if (!textToSend.trim() || isLoading) return;

    setInputValue("");
    setMessages((prev) => [...prev, { role: "USER", content: textToSend }]);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const res = await chatbotService.sendMessage(currentConversationId, textToSend);
      
      // If it was a new chat, the backend created an ID
      if (!currentConversationId) {
        setCurrentConversationId(res.data.conversationId);
        loadConversations();
      }

      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: res.data.reply },
      ]);

      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
      }

      if (res.data.type === "NAVIGATION" && res.data.metadata) {
        try {
          const meta = JSON.parse(res.data.metadata);
          if (meta.page) {
            navigate(meta.page);
          }
        } catch(e) {}
      } else if (res.data.type === "OPEN_MODAL" && res.data.metadata) {
        try {
          const meta = JSON.parse(res.data.metadata);
          if (meta.modal) {
            window.dispatchEvent(new CustomEvent("OPEN_MODAL", { detail: meta.modal }));
          }
        } catch(e) {}
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => [
        ...prev,
        { role: "SYSTEM", content: "Sorry, I am unable to connect to the server at the moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fade in={!isOpen}>
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            bgcolor: C.blue,
            color: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            "&:hover": { bgcolor: C.navy, transform: "scale(1.05)" },
            transition: "all 0.2s ease-in-out",
            zIndex: 9999,
          }}
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      </Fade>

      {/* Main Chat Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 380,
            height: 600,
            maxHeight: "80vh",
            display: isOpen ? "flex" : "none",
            flexDirection: "column",
            borderRadius: "16px",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: C.navy,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" sx={{ color: "white" }} onClick={() => setIsSidebarOpen(true)}>
                <HistoryIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600} fontSize={16}>
                OMS AI Assistant
              </Typography>
            </Box>
            <Box>
              <IconButton size="small" onClick={handleNewChat} sx={{ color: "white" }}>
                <AddIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: C.bgLight,
            }}
          >
            {messages.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.6}>
                <RobotIcon sx={{ fontSize: 60, color: C.blue, mb: 2 }} />
                <Typography variant="body1" textAlign="center" fontWeight={500}>
                  How can I help you with Outlet Management today?
                </Typography>
              </Box>
            ) : (
              messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    alignSelf: msg.role === "USER" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    flexDirection: msg.role === "USER" ? "row-reverse" : "row",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: msg.role === "USER" ? C.emerald : C.blue,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === "USER" ? <PersonIcon fontSize="small" /> : <RobotIcon fontSize="small" />}
                  </Box>
                  <Box
                    sx={{
                      bgcolor: msg.role === "USER" ? C.emeraldLight : "white",
                      color: C.navy,
                      p: 1.5,
                      borderRadius: 2,
                      borderTopRightRadius: msg.role === "USER" ? 0 : 2,
                      borderTopLeftRadius: msg.role === "USER" ? 2 : 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      fontSize: "0.9rem",
                      "& p": { m: 0 },
                      "& pre": { bgcolor: "#f5f5f5", p: 1, borderRadius: 1, overflowX: "auto" },
                    }}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </Box>
                </Box>
              ))
            )}
            
            {isLoading && (
              <Box display="flex" gap={1.5} alignItems="center">
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.blue, color: "white" }}>
                  <RobotIcon fontSize="small" />
                </Box>
                <CircularProgress size={20} sx={{ color: C.blue }} />
              </Box>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                {suggestions.map((suggestion, idx) => (
                  <Chip
                    key={idx}
                    label={suggestion}
                    onClick={() => handleSendMessage(suggestion)}
                    variant="outlined"
                    sx={{
                      color: C.blue,
                      borderColor: C.blue,
                      "&:hover": { bgcolor: C.blue, color: "white" }
                    }}
                  />
                ))}
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input Area */}
          <Box sx={{ p: 2, bgcolor: "white" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask anything..."
              variant="outlined"
              size="small"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                sx: { borderRadius: "12px", bgcolor: C.bgLight },
                endAdornment: (
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          {/* History Sidebar */}
          <Drawer
            anchor="left"
            open={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            PaperProps={{ sx: { width: 280, position: "absolute" } }}
            variant="temporary"
            hideBackdrop
            sx={{ position: "absolute", zIndex: 1 }}
          >
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" bgcolor={C.bgMuted}>
              <Typography variant="subtitle1" fontWeight={600}>Chat History</Typography>
              <IconButton size="small" onClick={() => setIsSidebarOpen(false)}><CloseIcon fontSize="small"/></IconButton>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflowY: "auto", p: 1 }}>
              {conversations.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>No previous chats</Typography>
              ) : (
                conversations.map((conv) => (
                  <ListItem
                    key={conv.id}
                    button
                    selected={conv.id === currentConversationId}
                    onClick={() => loadConversation(conv.id)}
                    sx={{ borderRadius: 1, mb: 0.5, pr: 6 }}
                  >
                    <ListItemText 
                      primary={conv.title} 
                      primaryTypographyProps={{ noWrap: true, fontSize: "0.85rem", fontWeight: 500 }} 
                    />
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      sx={{ position: "absolute", right: 8, opacity: 0.6, "&:hover": { opacity: 1, color: C.red } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))
              )}
            </List>
          </Drawer>
        </Paper>
      </Fade>
    </>
  );
};

export default ChatbotWidget;
