import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bot, Send, User, BookOpen, MessageCircle, Lightbulb, Calculator, Globe } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  subject?: string;
}

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${user?.name}! I'm your AI doubt solver. I can help you with questions related to Mathematics, Science, English, and Social Studies. What would you like to learn about today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Mathematics responses
    if (message.includes('math') || message.includes('algebra') || message.includes('geometry') || 
        message.includes('trigonometry') || message.includes('calculus') || message.includes('equation')) {
      const mathResponses = [
        "Great question about mathematics! Let me help you with this concept. Can you be more specific about which topic you're struggling with?",
        "Mathematics is all about understanding patterns and relationships. What specific problem are you trying to solve?",
        "I'd be happy to help with your math question! Could you share the specific equation or concept you're working on?",
        "For mathematical problems, it's always helpful to break them down step by step. What's the exact question you need help with?"
      ];
      return mathResponses[Math.floor(Math.random() * mathResponses.length)];
    }
    
    // Science responses
    if (message.includes('physics') || message.includes('chemistry') || message.includes('biology') || 
        message.includes('science') || message.includes('experiment') || message.includes('formula')) {
      const scienceResponses = [
        "Science is fascinating! Whether it's Physics, Chemistry, or Biology, I'm here to help. What specific topic interests you?",
        "Let's explore this scientific concept together! Can you tell me which subject area and what specific question you have?",
        "Scientific understanding comes from asking good questions. What phenomenon or concept would you like to understand better?",
        "I love helping with science questions! Are you working on a particular chapter or experiment?"
      ];
      return scienceResponses[Math.floor(Math.random() * scienceResponses.length)];
    }
    
    // English responses
    if (message.includes('english') || message.includes('grammar') || message.includes('essay') || 
        message.includes('literature') || message.includes('poem') || message.includes('story')) {
      const englishResponses = [
        "English language and literature offer so many beautiful concepts to explore! What aspect would you like help with?",
        "Whether it's grammar, literature analysis, or creative writing, I'm here to assist. What's your question?",
        "English can be tricky sometimes, but once you understand the patterns, it becomes much easier. How can I help?",
        "From Shakespeare to modern literature, English has so much to offer. What specific topic are you studying?"
      ];
      return englishResponses[Math.floor(Math.random() * englishResponses.length)];
    }
    
    // Social Studies responses
    if (message.includes('history') || message.includes('geography') || message.includes('civics') || 
        message.includes('social') || message.includes('politics') || message.includes('culture')) {
      const socialResponses = [
        "Social Studies helps us understand the world around us! Which area would you like to explore - History, Geography, or Civics?",
        "Understanding society, culture, and history is so important. What specific topic or time period interests you?",
        "Social Studies connects past, present, and future. What question do you have about human society and culture?",
        "From ancient civilizations to modern democracy, there's so much to learn! What aspect would you like to discuss?"
      ];
      return socialResponses[Math.floor(Math.random() * socialResponses.length)];
    }
    
    // Homework help
    if (message.includes('homework') || message.includes('assignment') || message.includes('help me solve')) {
      return "I'd be happy to help you with your homework! Please share the specific question or topic, and I'll guide you through the solution step by step. Remember, I'm here to help you understand, not just give answers!";
    }
    
    // Exam preparation
    if (message.includes('exam') || message.includes('test') || message.includes('preparation') || message.includes('study')) {
      return "Exam preparation can be stressful, but with the right approach, you can succeed! I can help you review concepts, practice problems, or create study strategies. What subject are you preparing for?";
    }
    
    // General responses
    const generalResponses = [
      "That's an interesting question! Could you provide more details so I can give you the most helpful answer?",
      "I'm here to help you learn and understand better. Can you be more specific about what you'd like to know?",
      "Learning is a journey, and I'm here to support you! What subject or topic would you like to explore?",
      "Great question! To give you the best help, could you tell me which subject this relates to and any specific details?",
      "I'm your academic assistant, ready to help with Math, Science, English, and Social Studies. What's on your mind today?"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const quickQuestions = [
    { text: "Help me with math problems", icon: Calculator, subject: "mathematics" },
    { text: "Explain a science concept", icon: BookOpen, subject: "science" },
    { text: "Grammar and writing help", icon: Globe, subject: "english" },
    { text: "History and geography", icon: MessageCircle, subject: "social" }
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Doubt Solver</h1>
            <p className="text-purple-100 text-sm">Your 24/7 academic assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="bg-white p-4 border-l border-r border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start:</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question.text)}
                className="flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <question.icon className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700">{question.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4 border-l border-r border-gray-200">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md flex ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } items-start space-x-2`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 ml-2' 
                    : 'bg-purple-600 mr-2'
                }`}
              >
                {message.sender === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-2">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-b-2xl border border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about Math, Science, English, or Social Studies..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
          <p>✨ Powered by AI • Available 24/7</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Lightbulb className="w-3 h-3 mr-1" />
              Smart Help
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              Need more help? Contact counselor
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;