import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConversationList } from '../../messages/components/ConversationList';
import { MessageThread } from '../../messages/components/MessageThread';
import { MessageComposer } from '../../messages/components/MessageComposer';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { useConversations } from '../../messages/hooks/useConversations';
import { useMessages } from '../../messages/hooks/useMessages';
import { Plus, Users, Shield, ArrowLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const OwnerMessagesPage: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    refresh,
  } = useConversations();

  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    isConnected,
    sendMessage,
  } = useMessages(activeConversationId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
              Messages & Channel Management
            </h1>
            <Badge variant="accent" size="sm">Admin Suite</Badge>
          </div>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Cross-client messaging oversight, direct client communication, and group channel control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="success" size="sm" dot>Live Gateway</Badge>
          ) : (
            <Badge variant="warning" size="sm" dot>Reconnecting...</Badge>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Group
          </Button>
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
                    aria-label="Back to channels"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-[var(--accent-cyan)] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[var(--text)] truncate">
                        {activeConversation.title ||
                          activeConversation.project?.name ||
                          'Direct Client Conversation'}
                      </p>
                      <Badge variant="neutral" size="sm">
                        {activeConversation.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[0.625rem] text-[var(--muted-text)]">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[var(--success-text)]" />
                        Owner Authorized
                      </span>
                      {activeConversation.project && (
                        <span>• Project: {activeConversation.project.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[0.6875rem] text-[var(--muted-text)]">
                  {activeConversation.memberships?.length || 2} Active Members
                </div>
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
              <Users className="w-8 h-8 text-[var(--muted-text)] mb-2" />
              <p className="text-sm font-semibold text-[var(--text)]">
                Select a channel
              </p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                Choose a conversation or create a new group channel to start communicating.
              </p>
            </div>
          )}
        </div>
      </Card>

      <CreateGroupModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={refresh}
      />
    </div>
  );
};
