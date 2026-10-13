// src/conversation/FarmerMessage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Search } from 'lucide-react';
import { supabase } from '../supabase/supabase-client';
import '../conversation/FarmerMessage.css';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface FarmerLite {
  id: string;
  full_name: string;
  email: string;
  address: string;
  avatar_path: string | null;
}

interface ConversationSummary {
  farmer: FarmerLite;
  lastMessage: Message;
  unreadCount: number;
}

interface FarmerMessageProps {
  adminId: string;
}

// Sign many storage paths in a single round-trip
async function signAvatarUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from('profile-avatars')
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

export default function FarmerMessage({ adminId }: FarmerMessageProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeFarmerId, setActiveFarmerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // ---- FIX: synchronous guard against double-submit ----
  const sendingRef = useRef(false);

  const activeFarmer = useMemo(
    () => conversations.find((c) => c.farmer.id === activeFarmerId)?.farmer,
    [conversations, activeFarmerId]
  );

  // ---- Load conversation list ----
  useEffect(() => {
    if (!adminId) return;
    let cancelled = false;

    const loadConversations = async () => {
      setLoadingConvos(true);

      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (msgsError) {
        console.error('Error loading conversations:', msgsError);
        setLoadingConvos(false);
        return;
      }

      const farmerIds = new Set<string>();
      (msgs ?? []).forEach((m) => {
        const other = m.sender_id === adminId ? m.receiver_id : m.sender_id;
        if (other && other !== adminId) farmerIds.add(other);
      });

      if (farmerIds.size === 0) {
        setConversations([]);
        setLoadingConvos(false);
        return;
      }

      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('id, full_name, email, address, avatar_path')
        .in('id', Array.from(farmerIds));

      if (cancelled) return;

      if (farmersError) {
        console.error('Error loading farmers:', farmersError);
        setLoadingConvos(false);
        return;
      }

      const avatarPaths = (farmers ?? [])
        .map((f) => f.avatar_path ?? '')
        .filter(Boolean);

      if (avatarPaths.length > 0) {
        const urls = await signAvatarUrls(avatarPaths);
        if (!cancelled) setAvatarUrls((prev) => ({ ...prev, ...urls }));
      }

      const farmerMap = new Map<string, FarmerLite>(
        (farmers ?? []).map((f) => [f.id, f as FarmerLite])
      );

      const summaries: ConversationSummary[] = [];
      const processedFarmerIds = new Set<string>();

      (msgs ?? []).forEach((m) => {
        const otherId =
          m.sender_id === adminId ? m.receiver_id : m.sender_id;
        if (processedFarmerIds.has(otherId)) return;
        processedFarmerIds.add(otherId);

        const farmer = farmerMap.get(otherId);
        if (!farmer) return;

        const unreadCount = (msgs ?? []).filter(
          (x) =>
            x.sender_id === otherId &&
            x.receiver_id === adminId &&
            x.read_at === null
        ).length;

        summaries.push({
          farmer,
          lastMessage: m,
          unreadCount,
        });
      });

      summaries.sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
      );

      setConversations(summaries);
      setLoadingConvos(false);

      if (summaries.length > 0 && !activeFarmerId) {
        setActiveFarmerId(summaries[0].farmer.id);
      }
    };

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [adminId, activeFarmerId]);

  // ---- Load messages for the active conversation ----
  useEffect(() => {
    if (!adminId || !activeFarmerId) return;
    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${activeFarmerId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${activeFarmerId})`
        )
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading messages:', error);
      } else {
        setMessages(data ?? []);

        const unreadIds = (data ?? [])
          .filter((m) => m.receiver_id === adminId && m.read_at === null)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      }
      setLoadingMessages(false);
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [adminId, activeFarmerId]);

  // ---- Real-time: listen for new messages from farmers ----
  useEffect(() => {
    if (!adminId) return;

    const subscription = supabase
      .channel(`admin-inbox-${adminId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const incoming = payload.new as Message;

          if (incoming.receiver_id === adminId) {
            if (incoming.sender_id === activeFarmerId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, incoming];
              });

              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', incoming.id)
                .then(() => {});
            }

            setConversations((prev) => {
              const existing = prev.find(
                (c) => c.farmer.id === incoming.sender_id
              );
              if (existing) {
                return prev
                  .map((c) =>
                    c.farmer.id === incoming.sender_id
                      ? {
                          ...c,
                          lastMessage: incoming,
                          unreadCount:
                            incoming.sender_id === activeFarmerId
                              ? 0
                              : c.unreadCount + 1,
                        }
                      : c
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.lastMessage.created_at).getTime() -
                      new Date(a.lastMessage.created_at).getTime()
                  );
              }
              return prev;
            });
          }

          if (
            incoming.sender_id === adminId &&
            incoming.receiver_id === activeFarmerId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [adminId, activeFarmerId]);

  // ---- Auto-scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Send reply (with double-submit guard) ----
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous guards — reject fast double-clicks and rapid Enter presses
    if (sendingRef.current) return;
    if (!newMessage.trim() || !activeFarmerId || !adminId) return;

    sendingRef.current = true;
    setSending(true);

    const content = newMessage.trim();
    const payload = {
      sender_id: adminId,
      receiver_id: activeFarmerId,
      content,
    };

    // Clear the input immediately so the same text can't be re-submitted
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      ...payload,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, optimistic]);

    const { error } = await supabase.from('messages').insert([payload]);

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(`Failed to send message.\n\n${error.message}`);
    }

    sendingRef.current = false;
    setSending(false);
  };

  const filteredConversations = conversations.filter((c) =>
    c.farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper: get the avatar URL for a farmer (if signed)
  const getAvatarUrl = (farmer: FarmerLite): string | null => {
    if (!farmer.avatar_path) return null;
    return avatarUrls[farmer.avatar_path] ?? null;
  };

  return (
    <div className="farmer-message-layout">
      {/* LEFT: Conversation list */}
      <aside className="conversation-list">
        <div className="conversation-list-header">
          <h2>Messages</h2>
          <div className="conversation-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search farmers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="conversation-list-body">
          {loadingConvos ? (
            <p className="conversation-empty">Loading conversations…</p>
          ) : filteredConversations.length === 0 ? (
            <p className="conversation-empty">
              {searchTerm
                ? 'No farmers match your search.'
                : 'No messages yet.'}
            </p>
          ) : (
            filteredConversations.map((c) => {
              const avatarUrl = getAvatarUrl(c.farmer);
              return (
                <button
                  key={c.farmer.id}
                  className={`conversation-item ${
                    c.farmer.id === activeFarmerId ? 'active' : ''
                  }`}
                  onClick={() => setActiveFarmerId(c.farmer.id)}
                  type="button"
                >
                  <div className="conversation-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" aria-hidden="true" />
                    ) : (
                      c.farmer.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-top">
                      <span className="conversation-name">
                        {c.farmer.full_name}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="conversation-badge">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="conversation-preview">
                      {c.lastMessage.content.length > 40
                        ? `${c.lastMessage.content.slice(0, 40)}…`
                        : c.lastMessage.content}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: Chat thread */}
      <section className="chat-thread">
        {activeFarmer ? (
          <>
            <header className="chat-thread-header">
              <div className="chat-thread-avatar">
                {(() => {
                  const avatarUrl = getAvatarUrl(activeFarmer);
                  return avatarUrl ? (
                    <img src={avatarUrl} alt="" aria-hidden="true" />
                  ) : (
                    activeFarmer.full_name.charAt(0).toUpperCase()
                  );
                })()}
              </div>
              <div className="chat-thread-info">
                <h3>{activeFarmer.full_name}</h3>
                <span>{activeFarmer.address || activeFarmer.email}</span>
              </div>
            </header>

            <div className="chat-thread-messages">
              {loadingMessages ? (
                <p className="chat-thread-empty">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="chat-thread-empty">
                  No messages with {activeFarmer.full_name} yet.
                </p>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender_id === adminId;
                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble ${
                        isAdmin ? 'chat-bubble-sent' : 'chat-bubble-received'
                      }`}
                    >
                      <p>{m.content}</p>
                      <span className="chat-bubble-time">
                        {new Date(m.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-thread-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={`Reply to ${activeFarmer.full_name}…`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-thread-placeholder">
            <p>Select a conversation to start replying</p>
          </div>
        )}
      </section>
    </div>
  );
}