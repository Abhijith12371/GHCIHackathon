import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, Square, Volume2, VolumeX, MessageCircle, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceBotProps {
  userId: string;
  onClose: () => void;
  onChatAction: () => Promise<void>;
}

const VoiceBot: React.FC<VoiceBotProps> = ({ userId, onClose, onChatAction }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you with banking information and payments. Start talking whenever you\'re ready.'
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenIndexRef = useRef<number>(0); // Start at 0 to speak initial message
  const pendingTranscriptRef = useRef<string>('');

  // Memoize handleSendMessage to avoid dependency issues
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message })
      });

      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      if (data.payment_success || data.intent === 'CHECK_BALANCE') {
        await onChatAction();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, onChatAction]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        pendingTranscriptRef.current = '';
        setTranscript('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcriptSegment + ' ';
          } else {
            interimTranscript += transcriptSegment;
          }
        }

        if (finalTranscript) {
          pendingTranscriptRef.current += finalTranscript;
        }

        // Show interim results
        setTranscript(pendingTranscriptRef.current + interimTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        const finalText = pendingTranscriptRef.current.trim();
        
        if (finalText) {
          handleSendMessage(finalText);
        }
        
        pendingTranscriptRef.current = '';
        setTranscript('');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        pendingTranscriptRef.current = '';
        setTranscript('');
      };
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    };
  }, [handleSendMessage, isListening]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak new assistant messages
  useEffect(() => {
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];

    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      voiceEnabled &&
      synthRef.current &&
      !isLoading &&
      !isListening &&
      lastMessageIndex > lastSpokenIndexRef.current
    ) {
      lastSpokenIndexRef.current = lastMessageIndex;
      speakText(lastMessage.content);
    }
  }, [messages, voiceEnabled, isLoading, isListening]);

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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop speaking before listening
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,140,40,0.08),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 bg-gradient-to-br from-slate-100 to-slate-200 border-b-2 border-slate-300 skeu-raised">
        <div className="flex items-center gap-3">
          <div className="skeu-button gold-accent p-2 rounded-xl">
            <MessageCircle className="w-5 h-5 text-amber-900" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 embossed-text">Voice Banking Elite</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="skeu-button p-3 rounded-xl transition-all"
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-700" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="skeu-button px-4 py-2 rounded-xl text-sm text-slate-700 font-semibold embossed-text"
            >
              Stop
            </button>
          )}
          <button
            onClick={onClose}
            className="skeu-button p-3 rounded-xl transition-all"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-2xl px-6 py-4 rounded-2xl shadow-xl ${
                msg.role === 'user'
                  ? 'gold-accent text-amber-900 rounded-br-none embossed-text'
                  : 'skeu-card text-slate-800 rounded-bl-none debossed-text'
              }`}
            >
              <p className="text-base leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="skeu-card text-slate-800 px-6 py-4 rounded-2xl rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {isListening && transcript && (
          <div className="flex justify-end">
            <div className="max-w-2xl px-6 py-4 rounded-2xl rounded-br-none skeu-card text-slate-800">
              <p className="text-base italic opacity-75 debossed-text">{transcript}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Microphone Button */}
      <div className="relative z-10 flex flex-col items-center gap-6 pb-12 bg-gradient-to-br from-slate-100 to-slate-200">
        <button
          onClick={toggleListening}
          disabled={isLoading}
          className={`rounded-full p-6 transition-all transform ${
            isListening
              ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110 shadow-2xl animate-pulse'
              : 'skeu-button gold-accent hover:scale-105 shadow-2xl pulse-soft'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <Square className={`w-10 h-10 text-white`} />
          ) : (
            <Mic className="w-10 h-10 text-amber-900" />
          )}
        </button>
        <div className="text-center">
          <p className="text-slate-800 font-semibold text-lg mb-1 embossed-text">
            {isListening
              ? 'Listening...'
              : isSpeaking
              ? 'Speaking...'
              : isLoading
              ? 'Processing...'
              : 'Ready to Listen'}
          </p>
          <p className="text-slate-600 text-sm debossed-text">
            {isListening
              ? 'Click to stop recording'
              : 'Click the mic to start speaking'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceBot;