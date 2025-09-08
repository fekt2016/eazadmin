// src/components/ChatSystem.js
import { useState } from "react";
import styled from "styled-components";
import {
  FiSend,
  FiSearch,
  FiMoreVertical,
  FiChevronLeft,
  FiShoppingBag,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { FaStore, FaUserTie, FaRegSmile } from "react-icons/fa";

export default function ChaSupportPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for vendors and customers
  const vendors = [
    {
      id: 1,
      name: "Tech Gadgets Inc",
      online: true,
      unread: 2,
      lastSeen: "2 min ago",
    },
    {
      id: 2,
      name: "Fashion Boutique",
      online: false,
      unread: 0,
      lastSeen: "1 hour ago",
    },
    {
      id: 3,
      name: "Home Essentials",
      online: true,
      unread: 0,
      lastSeen: "5 min ago",
    },
    {
      id: 4,
      name: "Book Paradise",
      online: true,
      unread: 5,
      lastSeen: "Just now",
    },
    {
      id: 5,
      name: "Sportswear Hub",
      online: false,
      unread: 0,
      lastSeen: "3 hours ago",
    },
  ];

  const customers = [
    {
      id: 101,
      name: "Alex Johnson",
      online: true,
      unread: 0,
      lastSeen: "Online",
    },
    {
      id: 102,
      name: "Sarah Williams",
      online: true,
      unread: 3,
      lastSeen: "Online",
    },
    {
      id: 103,
      name: "Michael Chen",
      online: false,
      unread: 0,
      lastSeen: "2 days ago",
    },
    {
      id: 104,
      name: "Emma Rodriguez",
      online: true,
      unread: 0,
      lastSeen: "Online",
    },
    {
      id: 105,
      name: "David Smith",
      online: false,
      unread: 0,
      lastSeen: "1 week ago",
    },
  ];

  // Mock conversation data
  const conversations = {
    vendor1: [
      {
        id: 1,
        sender: "vendor",
        text: "Hello! Thanks for contacting Tech Gadgets Inc.",
        time: "10:30 AM",
      },
      {
        id: 2,
        sender: "user",
        text: "Hi, I have a question about the wireless headphones I ordered.",
        time: "10:31 AM",
      },
      {
        id: 3,
        sender: "vendor",
        text: "Sure, I can help with that. What would you like to know?",
        time: "10:32 AM",
      },
      {
        id: 4,
        sender: "user",
        text: "The delivery date shows tomorrow, but I need it today. Is it possible to expedite?",
        time: "10:33 AM",
      },
    ],
    customer102: [
      {
        id: 1,
        sender: "user",
        text: "Hi Sarah, I saw you added our premium yoga mat to your cart!",
        time: "9:15 AM",
      },
      {
        id: 2,
        sender: "customer",
        text: "Yes, I was wondering if you offer free shipping?",
        time: "9:16 AM",
      },
      {
        id: 3,
        sender: "user",
        text: "We offer free shipping on orders over $50. Your current order is $45.",
        time: "9:17 AM",
      },
      {
        id: 4,
        sender: "customer",
        text: "Okay, I might add something else then. Thanks!",
        time: "9:18 AM",
      },
    ],
    vendor4: [
      {
        id: 1,
        sender: "vendor",
        text: "Welcome to Book Paradise! How can I help you?",
        time: "Yesterday",
      },
      {
        id: 2,
        sender: "user",
        text: "Do you have the latest Stephen King novel in stock?",
        time: "Yesterday",
      },
      {
        id: 3,
        sender: "vendor",
        text: "Yes, we have 5 copies left. Would you like to reserve one?",
        time: "Yesterday",
      },
      {
        id: 4,
        sender: "user",
        text: "Yes please! Can you hold one for me until tomorrow?",
        time: "Yesterday",
      },
      {
        id: 5,
        sender: "vendor",
        text: "Absolutely! Reserved under your name.",
        time: "Yesterday",
      },
    ],
  };

  const [activeMessages, setActiveMessages] = useState([]);

  const handleChatSelect = (type, id) => {
    setActiveChat({ type, id });

    // Set messages based on selected chat
    if (type === "vendor") {
      setActiveMessages(conversations[`vendor${id}`] || []);
    } else {
      setActiveMessages(conversations[`customer${id}`] || []);
    }
  };

  const sendMessage = () => {
    if (message.trim() === "") return;

    const newMessage = {
      id: activeMessages.length + 1,
      sender: "user",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setActiveMessages([...activeMessages, newMessage]);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <ChatContainer>
      <Sidebar>
        <SidebarHeader>
          <h2>Messages</h2>
          <SearchContainer>
            <FiSearch />
            <SearchInput
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
        </SidebarHeader>

        <Section>
          <SectionHeader>
            <FaUserTie />
            <h3>Vendors</h3>
          </SectionHeader>
          <ConversationList>
            {vendors.map((vendor) => (
              <ConversationItem
                key={vendor.id}
                active={
                  activeChat?.type === "vendor" && activeChat.id === vendor.id
                }
                onClick={() => handleChatSelect("vendor", vendor.id)}
              >
                <VendorIcon>
                  <FaStore />
                  {vendor.online && <OnlineIndicator />}
                </VendorIcon>
                <ConversationInfo>
                  <Name>{vendor.name}</Name>
                  <LastSeen>
                    {vendor.online ? "Online" : `Last seen ${vendor.lastSeen}`}
                  </LastSeen>
                </ConversationInfo>
                {vendor.unread > 0 && (
                  <UnreadCount>{vendor.unread}</UnreadCount>
                )}
              </ConversationItem>
            ))}
          </ConversationList>
        </Section>

        <Section>
          <SectionHeader>
            <FiUser />
            <h3>Customers</h3>
          </SectionHeader>
          <ConversationList>
            {customers.map((customer) => (
              <ConversationItem
                key={customer.id}
                active={
                  activeChat?.type === "customer" &&
                  activeChat.id === customer.id
                }
                onClick={() => handleChatSelect("customer", customer.id)}
              >
                <CustomerIcon online={customer.online}>
                  {customer.name.charAt(0)}
                </CustomerIcon>
                <ConversationInfo>
                  <Name>{customer.name}</Name>
                  <LastSeen>
                    {customer.online
                      ? "Online"
                      : `Last seen ${customer.lastSeen}`}
                  </LastSeen>
                </ConversationInfo>
                {customer.unread > 0 && (
                  <UnreadCount>{customer.unread}</UnreadCount>
                )}
              </ConversationItem>
            ))}
          </ConversationList>
        </Section>
      </Sidebar>

      <MainChatArea>
        {activeChat ? (
          <>
            <ChatHeader>
              <BackButton onClick={() => setActiveChat(null)}>
                <FiChevronLeft />
              </BackButton>
              <ChatPartnerInfo>
                {activeChat.type === "vendor" ? (
                  <>
                    <VendorIcon>
                      <FaStore />
                      {vendors.find((v) => v.id === activeChat.id).online && (
                        <OnlineIndicator />
                      )}
                    </VendorIcon>
                    <div>
                      <h3>
                        {vendors.find((v) => v.id === activeChat.id).name}
                      </h3>
                      <Status>
                        {vendors.find((v) => v.id === activeChat.id).online
                          ? "Online"
                          : `Last seen ${
                              vendors.find((v) => v.id === activeChat.id)
                                .lastSeen
                            }`}
                      </Status>
                    </div>
                  </>
                ) : (
                  <>
                    <CustomerIcon
                      online={
                        customers.find((c) => c.id === activeChat.id).online
                      }
                    >
                      {customers
                        .find((c) => c.id === activeChat.id)
                        .name.charAt(0)}
                    </CustomerIcon>
                    <div>
                      <h3>
                        {customers.find((c) => c.id === activeChat.id).name}
                      </h3>
                      <Status>
                        {customers.find((c) => c.id === activeChat.id).online
                          ? "Online"
                          : `Last seen ${
                              customers.find((c) => c.id === activeChat.id)
                                .lastSeen
                            }`}
                      </Status>
                    </div>
                  </>
                )}
              </ChatPartnerInfo>
              <HeaderActions>
                <ActionButton>
                  <FiShoppingBag />
                </ActionButton>
                <ActionButton>
                  <FiMoreVertical />
                </ActionButton>
              </HeaderActions>
            </ChatHeader>

            <ChatMessages>
              {activeMessages.map((msg) => (
                <Message
                  key={msg.id}
                  type={msg.sender === "user" ? "sent" : "received"}
                >
                  <MessageContent>{msg.text}</MessageContent>
                  <MessageTime>
                    <FiClock /> {msg.time}
                  </MessageTime>
                </Message>
              ))}
            </ChatMessages>

            <MessageInputContainer>
              <EmojiButton>
                <FaRegSmile />
              </EmojiButton>
              <MessageInput
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <SendButton onClick={sendMessage}>
                <FiSend />
              </SendButton>
            </MessageInputContainer>
          </>
        ) : (
          <EmptyState>
            <h2>Select a conversation</h2>
            <p>Choose a vendor or customer to start chatting</p>
          </EmptyState>
        )}
      </MainChatArea>
    </ChatContainer>
  );
}

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f8fafc;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Sidebar = styled.div`
  width: 320px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    margin: 0 0 1.2rem 0;
    font-size: 1.5rem;
    color: #1e293b;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.5rem 1rem;

  svg {
    color: #94a3b8;
    margin-right: 0.5rem;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  padding: 0.5rem 0;
  width: 100%;
  outline: none;
  color: #334155;
  font-size: 0.95rem;

  &::placeholder {
    color: #94a3b8;
  }
`;

const Section = styled.div`
  padding: 1rem 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    margin-right: 0.75rem;
  }

  h3 {
    margin: 0;
    font-weight: 600;
    font-size: 0.85rem;
  }
`;

const ConversationList = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const ConversationItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  background: ${({ active }) => (active ? "#f1f5f9" : "transparent")};
  border-left: ${({ active }) => (active ? "3px solid #6366f1" : "none")};

  &:hover {
    background: #f1f5f9;
  }
`;

const VendorIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0ea5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 1.1rem;
`;

const CustomerIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: ${({ online }) => (online ? "#dcfce7" : "#f1f5f9")};
  color: ${({ online }) => (online ? "#166534" : "#64748b")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid white;
`;

const ConversationInfo = styled.div`
  margin-left: 0.8rem;
  flex: 1;
  overflow: hidden;
`;

const Name = styled.div`
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastSeen = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadCount = styled.div`
  background: #6366f1;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MainChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1.2rem;

  @media (min-width: 768px) {
    display: none;
  }
`;

const ChatPartnerInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;

  > div {
    margin-left: 1rem;

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1e293b;
    }
  }
`;

const Status = styled.div`
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.2rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 1.1rem;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const Message = styled.div`
  max-width: 75%;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  position: relative;
  align-self: ${({ type }) => (type === "sent" ? "flex-end" : "flex-start")};
  background: ${({ type }) => (type === "sent" ? "#6366f1" : "#ffffff")};
  color: ${({ type }) => (type === "sent" ? "white" : "#334155")};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  word-break: break-word;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 10px;
    ${({ type }) => (type === "sent" ? "right: -8px;" : "left: -8px;")};
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
  }
`;

const MessageContent = styled.div`
  font-size: 0.95rem;
  line-height: 1.5;
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  color: ${({ type }) =>
    type === "sent" ? "rgba(255, 255, 255, 0.8)" : "#94a3b8"};

  svg {
    margin-right: 0.3rem;
  }
`;

const MessageInputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 1.2rem;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }
`;

const MessageInput = styled.input`
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 0.8rem 1.2rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const SendButton = styled.button`
  background: #6366f1;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 1.2rem;
  margin-left: 0.8rem;
  transition: background 0.2s;

  &:hover {
    background: #4f46e5;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  padding: 2rem;

  h2 {
    font-size: 1.8rem;
    color: #1e293b;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    max-width: 400px;
    line-height: 1.6;
  }
`;
