import React, { useEffect, useState, useRef } from 'react';
import { SendIcon, MicIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  userId: string;
  onChatAction: () => Promise<void>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  onChatAction
}) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I can help with balances, transactions, payees, payments, and payment history. How can I assist you?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  useEffect(() => {
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];

    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      voiceEnabled &&
      synthRef.current &&
      !isLoading &&
      lastMessageIndex > lastSpokenIndexRef.current
    ) {
      lastSpokenIndexRef.current = lastMessageIndex;
      speakText(lastMessage.content);
    }
  }, [messages, voiceEnabled, isLoading]);

  const speakText = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    setInput('');
    setIsLoading(true);

    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);

      setPaymentMode(data.payment_mode || false);

      if (data.payment_success || data.intent === 'CHECK_BALANCE') {
        await onChatAction();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="skeu-card rounded-3xl h-[600px] flex flex-col overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-slate-100 to-slate-200 border-b-2 border-slate-300 flex justify-between items-center skeu-raised">
        <h2 className="font-bold text-lg text-slate-800 embossed-text">Banking Assistant</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleVoice}
            className="skeu-button p-2 rounded-lg transition-colors"
            title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          >
            {voiceEnabled ? (
              <Volume2Icon className="w-5 h-5 text-blue-700" />
            ) : (
              <VolumeXIcon className="w-5 h-5 text-slate-400" />
            )}
          </button>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="skeu-button px-3 py-1 rounded-lg text-sm text-slate-700 font-medium embossed-text"
            >
              Stop
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'gold-accent text-amber-900 rounded-br-none shadow-lg embossed-text'
                  : 'skeu-card text-slate-800 rounded-bl-none debossed-text'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="skeu-card p-4 rounded-2xl rounded-bl-none text-slate-800">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-5 border-t-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 skeu-raised">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              isRecording
                ? 'Listening...'
                : paymentMode
                ? 'Continue payment process...'
                : 'Ask about your banking or click mic to speak...'
            }
            className="flex-1 skeu-input rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition-all"
            disabled={isLoading || isRecording}
          />
          <button
            type="submit"
            className="skeu-button gold-accent p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !input.trim() || isRecording}
          >
            <SendIcon className="w-5 h-5 text-amber-900" />
          </button>
          <button
            type="button"
            onClick={startRecording}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg animate-pulse'
                : 'skeu-button bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
            disabled={isLoading}
          >
            <MicIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
