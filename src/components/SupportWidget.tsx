import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Phone,
  Mail,
  ChevronUp,
} from 'lucide-react';
import { CONTACT } from '@/lib/constants';
import './SupportWidget.css';

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'call' | 'whatsapp'>('chat');

  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([
    {
      sender: 'bot',
      text: 'Welcome to NovaBank Support! How can I help you today?',
    },
  ]);

  const [input, setInput] = useState('');

  const [callStatus, setCallStatus] = useState<
    'idle' | 'connecting' | 'connected'
  >('idle');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
      },
    ]);

    setInput('');

    setTimeout(() => {
      const responses: Record<string, string> = {
        hello:
          'Hello! How can I assist you with your banking needs today?',

        transfer:
          'To transfer funds, go to the Fund Transfer section in your Customer Portal dashboard.',

        card:
          'For card-related issues, navigate to Card Management in your dashboard. You can block, freeze, or request a replacement there.',

        loan:
          'You can apply for loans through the Loan Management section. We offer Personal, Home, Vehicle, and Education loans.',

        kyc:
          'KYC verification can be completed in the Profile/KYC section of your Customer Portal.',

        fraud:
          'If you suspect fraud, please call our emergency hotline immediately at ' +
          CONTACT.emergencyPhone +
          '.',

        help:
          'I can help with transfers, cards, loans, KYC, statements, and fraud alerts. What do you need assistance with?',
      };

      const lower = userMsg.toLowerCase();

      let response =
        'Thank you for your message. Our team will get back to you shortly. For urgent matters, please call ' +
        CONTACT.emergencyPhone +
        '.';

      for (const key in responses) {
        if (lower.includes(key)) {
          response = responses[key];
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: response,
        },
      ]);
    }, 800);
  };

  const initiateCall = () => {
    setCallStatus('connecting');

    setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
  };

  const whatsappUrl =
    `https://wa.me/91${CONTACT.whatsappNumber}` +
    `?text=Hello%20NovaBank%20Support%2C%20I%20need%20assistance`;

  return (
    <div className="support-widget">

      {/* Support Panel */}
      {isOpen && (
        <div className="support-panel">

          {/* Header */}
          <div className="support-header">

            <div className="support-header-info">
              <MessageCircle size={22} />

              <div>
                <p className="support-title">
                  NovaBank Support
                </p>

                <p className="support-subtitle">
                  24/7 Customer Service
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="support-close-button"
              aria-label="Close support"
            >
              <X size={18} />
            </button>

          </div>

          {/* Tabs */}
          <div className="support-tabs">

            <TabButton
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              icon={<MessageCircle size={15} />}
              label="Live Chat"
            />

            <TabButton
              active={activeTab === 'call'}
              onClick={() => setActiveTab('call')}
              icon={<Phone size={15} />}
              label="Emergency"
            />

            <TabButton
              active={activeTab === 'whatsapp'}
              onClick={() => setActiveTab('whatsapp')}
              icon={<Send size={15} />}
              label="WhatsApp"
            />

          </div>

          {/* Content */}
          <div className="support-content">

            {/* CHAT */}
            {activeTab === 'chat' && (
              <div className="support-chat">

                <div className="support-message-list">

                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`support-message-row ${
                        msg.sender === 'user'
                          ? 'support-message-user'
                          : 'support-message-bot'
                      }`}
                    >
                      <div
                        className={`support-message ${
                          msg.sender === 'user'
                            ? 'support-message-user-bubble'
                            : 'support-message-bot-bubble'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  <div ref={chatEndRef} />

                </div>

                <div className="support-chat-input-area">

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && sendMessage()
                    }
                    placeholder="Type your message..."
                    className="support-chat-input"
                  />

                  <button
                    onClick={sendMessage}
                    className="support-send-button"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>

                </div>

              </div>
            )}

            {/* CALL */}
            {activeTab === 'call' && (
              <div className="support-call">

                <div className="support-call-icon">
                  <Phone size={36} />
                </div>

                {callStatus === 'idle' && (
                  <>
                    <p className="support-call-description">
                      Emergency Support Hotline
                      <br />
                      Available 24/7 for fraud, card blocking,
                      and urgent issues
                    </p>

                    <p className="support-phone">
                      {CONTACT.emergencyPhone}
                    </p>

                    <button
                      onClick={initiateCall}
                      className="support-call-button"
                    >
                      <Phone size={18} />
                      Call Now
                    </button>
                  </>
                )}

                {callStatus === 'connecting' && (
                  <>
                    <p className="support-status">
                      Connecting...
                    </p>

                    <div className="support-spinner" />
                  </>
                )}

                {callStatus === 'connected' && (
                  <>
                    <p className="support-connected">
                      Call Connected
                    </p>

                    <p className="support-call-description">
                      You are now connected with a NovaBank
                      support agent. In a real deployment,
                      this would connect to our call center.
                    </p>

                    <button
                      onClick={() => setCallStatus('idle')}
                      className="support-end-call"
                    >
                      End Call
                    </button>
                  </>
                )}

              </div>
            )}

            {/* WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="support-whatsapp">

                <div className="support-whatsapp-icon">
                  <Send size={36} />
                </div>

                <p className="support-whatsapp-description">
                  Chat with us on WhatsApp for quick assistance.
                  Send us a message and we will respond during
                  business hours.
                </p>

                <p className="support-phone">
                  +91 {CONTACT.whatsappNumber}
                </p>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-whatsapp-button"
                >
                  <Send size={18} />
                  Open WhatsApp
                </a>

                <a
                  href={`mailto:${CONTACT.email}`}
                  className="support-email-link"
                >
                  <Mail size={14} />
                  {CONTACT.email}
                </a>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="support-floating-button"
        aria-label="Support"
      >
        {isOpen ? (
          <ChevronUp size={24} />
        ) : (
          <MessageCircle size={24} />
        )}

        {!isOpen && (
          <span className="support-notification-badge">
            1
          </span>
        )}
      </button>

    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`support-tab ${
        active ? 'support-tab-active' : ''
      }`}
    >
      {icon}
      {label}
    </button>
  );
}