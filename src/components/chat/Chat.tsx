import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Lock, Plus, Search, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ChatChannel, Message, User } from '../../types';
import { useAuth } from '../../hooks/useAuth.tsx';
import * as api from '../../lib/api';

const mockChannels: ChatChannel[] = [
  {
    id: '1',
    name: 'general',
    description: 'General team discussion',
    type: 'public',
    members: [],
    createdAt: new Date('2024-01-01'),
    unreadCount: 3
  },
  {
    id: '2',
    name: 'development',
    description: 'Development discussions',
    type: 'public',
    members: [],
    createdAt: new Date('2024-01-05'),
    unreadCount: 7
  },
  {
    id: '3',
    name: 'design',
    description: 'Design team channel',
    type: 'private',
    members: [],
    createdAt: new Date('2024-01-10'),
    unreadCount: 0
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey everyone! How is the project going?',
    author: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'designer',
      lastActive: new Date()
    },
    channel: mockChannels[0],
    createdAt: new Date('2024-01-20T09:00:00'),
    mentions: [],
  },
  {
    id: '2',
    content: 'Making great progress on the authentication system! Should be ready for review tomorrow.',
    author: {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'developer',
      lastActive: new Date()
    },
    channel: mockChannels[0],
    createdAt: new Date('2024-01-20T09:15:00'),
    mentions: [],
  },
  {
    id: '3',
    content: 'Awesome! I\'ll prepare the UI components for integration.',
    author: {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      role: 'developer',
      lastActive: new Date()
    },
    channel: mockChannels[0],
    createdAt: new Date('2024-01-20T09:30:00'),
    mentions: [],
  }
];

export function Chat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      setIsLoading(true);
      try {
        const apiChannels = await api.fetchChannels();
        const convertedChannels: ChatChannel[] = apiChannels.map(ch => ({
          id: ch.id,
          name: ch.name,
          description: ch.description,
          type: ch.type,
          members: [],
          createdAt: new Date(),
          unreadCount: 0
        }));
        
        setChannels(convertedChannels);
        if (convertedChannels.length > 0) {
          setSelectedChannel(convertedChannels[0]);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
        // Fallback to mock data
        setChannels(mockChannels);
        setSelectedChannel(mockChannels[0]);
      } finally {
        setIsLoading(false);
      }
    };
    loadChannels();
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return;
    
    const loadMessages = async () => {
      try {
        const apiMessages = await api.fetchMessages(selectedChannel.id);
        const convertedMessages: Message[] = apiMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          author: {
            id: msg.author.id,
            name: msg.author.name,
            email: msg.author.name + '@example.com',
            role: 'developer',
            lastActive: new Date()
          },
          channel: selectedChannel,
          createdAt: new Date(msg.createdAt),
          mentions: []
        }));
        setMessages(convertedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Fallback to mock data for current channel
        setMessages(mockMessages.filter(msg => msg.channel.id === selectedChannel.id));
      }
    };
    loadMessages();
  }, [selectedChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChannel) return;

    try {
      const apiMessage = await api.sendMessage(selectedChannel.id, newMessage);
      
      const message: Message = {
        id: apiMessage.id,
        content: apiMessage.content,
        author: user,
        channel: selectedChannel,
        createdAt: new Date(apiMessage.createdAt),
        mentions: []
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback to local message
      const message: Message = {
        id: Math.random().toString(36),
        content: newMessage,
        author: user,
        channel: selectedChannel,
        createdAt: new Date(),
        mentions: []
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const channelMessages = selectedChannel ? messages.filter(message => message.channel.id === selectedChannel.id) : [];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="text-lg text-gray-600">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-80 bg-white border-r border-gray-200 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
            <Button size="sm" variant="ghost">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredChannels.map((channel) => (
            <motion.button
              key={channel.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left mb-1 transition-colors ${
                selectedChannel?.id === channel.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                {channel.type === 'public' ? (
                  <Hash className="w-4 h-4 text-gray-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium">{channel.name}</span>
              </div>
              {channel.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {channel.unreadCount}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            {selectedChannel?.type === 'public' ? (
              <Hash className="w-5 h-5 text-gray-400" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                #{selectedChannel?.name || 'Select a channel'}
              </h1>
              {selectedChannel?.description && (
                <p className="text-sm text-gray-600">{selectedChannel.description}</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="ghost">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {channelMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex space-x-3"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {message.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-gray-900">{message.author.name}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-t border-gray-200 p-4"
        >
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={`Message #${selectedChannel?.name || 'channel'}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                disabled={!selectedChannel}
              />
            </div>
            <Button type="submit" disabled={!newMessage.trim() || !selectedChannel}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}