import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';
import { MessageComposer } from '../components/MessageComposer';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const MessagesPage: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
  } = useConversations();

  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    isConnected,
    sendMessage,
  } = useMessages(activeConversationId);

  // Mobile navigation state
  const [showMobileThread, setShowMobileThread] = useState(false);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowMobileThread(true);
  };

  return (
    <div className="space-y-4 text-left max-w-6xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Messages & Communication
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Real-time collaboration with Stephen on project deliverables and milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="success" size="sm" dot>Connected</Badge>
          ) : (
            <Badge variant="warning" size="sm" dot>Reconnecting...</Badge>
          )}
        </div>
      </div>

      {/* Main Container */}
      <Card className="flex-1 flex overflow-hidden p-0 border border-[var(--border)] bg-[var(--surface)]">
        {/* Left Column: Conversation List */}
        <div
          className={cn(
            'w-full md:w-80 shrink-0 h-full flex flex-col',
            showMobileThread ? 'hidden md:flex' : 'flex',
          )}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Right Column: Active Thread + Composer */}
        <div
          className={cn(
            'flex-1 flex-col h-full bg-[var(--canvas)]',
            showMobileThread ? 'flex' : 'hidden md:flex',
          )}
        >
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileThread(false)}
                    className="md:hidden p-1.5 text-[var(--muted-text)] hover:text-[var(--text)] rounded-lg"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                    SO
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">
                      {activeConversation.title ||
                        activeConversation.project?.name ||
                        'Stephen Oderinde'}
                    </p>
                    <div className="flex items-center gap-1 text-[0.625rem] text-[var(--muted-text)]">
                      <ShieldCheck className="w-3 h-3 text-[var(--success-text)]" />
                      <span>Encrypted • Authorized Channel</span>
                    </div>
                  </div>
                </div>

                <Badge variant="neutral" size="sm">
                  {activeConversation.type}
                </Badge>
              </div>

              {/* Message Stream */}
              <MessageThread
                messages={messages}
                isLoading={isMessagesLoading}
              />

              {/* Composer */}
              <MessageComposer
                onSend={sendMessage}
                isSending={isSending}
                isConnected={isConnected}
                projectId={activeConversation.projectId}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-8 h-8 text-[var(--muted-text)] mb-2" />
              <p className="text-sm font-semibold text-[var(--text)]">
                Select a channel
              </p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                Choose a conversation from the left to start messaging.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
