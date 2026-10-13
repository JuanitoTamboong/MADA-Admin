// src/conversation/FarmerMessage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Search, ImagePlus, Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '../supabase/supabase-client';
import '../conversation/FarmerMessage.css';

// ---------- Types ----------

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_path: string | null;
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

// ---------- Constants ----------

const CHAT_IMAGE_BUCKET = 'chat-images';
const AVATAR_BUCKET = 'profile-avatars';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// ---------- Helpers ----------

async function signPaths(
  bucket: string,
  paths: string[],
): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

function makeTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Component ----------

export default function FarmerMessage({ adminId }: FarmerMessageProps) {
  // Data
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeFarmerId, setActiveFarmerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Input state
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Staged (not-yet-sent) image
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  // Loading flags
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Signed asset URLs
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Edit / delete state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [showDeleteConversation, setShowDeleteConversation] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks temp ids so the realtime handler can reconcile them
  const pendingTempIdsRef = useRef<Set<string>>(new Set());

  const activeFarmer = useMemo(
    () => conversations.find((c) => c.farmer.id === activeFarmerId)?.farmer,
    [conversations, activeFarmerId],
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
        const urls = await signPaths(AVATAR_BUCKET, avatarPaths);
        if (!cancelled) setAvatarUrls((prev) => ({ ...prev, ...urls }));
      }

      const farmerMap = new Map<string, FarmerLite>(
        (farmers ?? []).map((f) => [f.id, f as FarmerLite]),
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
            x.read_at === null,
        ).length;

        summaries.push({ farmer, lastMessage: m, unreadCount });
      });

      summaries.sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime(),
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
          `and(sender_id.eq.${activeFarmerId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${activeFarmerId})`,
        )
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading messages:', error);
        setLoadingMessages(false);
        return;
      }

      const rows = data ?? [];
      setMessages(rows);

      const imagePaths = rows
        .map((m) => m.image_path ?? '')
        .filter(Boolean);

      if (imagePaths.length > 0) {
        const urls = await signPaths(CHAT_IMAGE_BUCKET, imagePaths);
        if (!cancelled) setImageUrls((prev) => ({ ...prev, ...urls }));
      }

      const unreadIds = rows
        .filter((m) => m.receiver_id === adminId && m.read_at === null)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }

      setLoadingMessages(false);
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [adminId, activeFarmerId]);

  // ---- Real-time subscription ----
  useEffect(() => {
    if (!adminId) return;

    const channel = supabase
      .channel(`admin-inbox-${adminId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
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
                (c) => c.farmer.id === incoming.sender_id,
              );
              if (!existing) return prev;

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
                    : c,
                )
                .sort(
                  (a, b) =>
                    new Date(b.lastMessage.created_at).getTime() -
                    new Date(a.lastMessage.created_at).getTime(),
                );
            });
          }

          if (
            incoming.sender_id === adminId &&
            incoming.receiver_id === activeFarmerId
          ) {
            // Reconcile: replace any pending temp message with the real row
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              const tempIds = pendingTempIdsRef.current;
              // Find the temp message that matches this real one
              // (same sender/receiver/content/image_path, still pending)
              const temp = prev.find(
                (m) =>
                  tempIds.has(m.id) &&
                  m.sender_id === incoming.sender_id &&
                  m.receiver_id === incoming.receiver_id &&
                  (m.content || '') === (incoming.content || '') &&
                  (m.image_path ?? null) === (incoming.image_path ?? null),
              );
              if (temp) {
                tempIds.delete(temp.id);
                return prev.map((m) =>
                  m.id === temp.id ? incoming : m,
                );
              }
              return [...prev, incoming];
            });
          }

          if (incoming.image_path) {
            setImageUrls((prev) => {
              if (prev[incoming.image_path!]) return prev;
              signPaths(CHAT_IMAGE_BUCKET, [incoming.image_path!]).then(
                (urls) => setImageUrls((p) => ({ ...p, ...urls })),
              );
              return prev;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId, activeFarmerId]);

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Send (text and/or staged image) ----
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // Atomic lock
    if (sendingRef.current) return;
    sendingRef.current = true;

    const trimmed = newMessage.trim();
    const hasImage = !!pendingImage;

    if ((!trimmed && !hasImage) || !activeFarmerId || !adminId) {
      sendingRef.current = false;
      return;
    }

    const targetFarmerId = activeFarmerId;
    const content = trimmed;
    const imageToSend = pendingImage;

    setSending(true);
    setUploading(!!imageToSend);
    setNewMessage('');
    setPendingImage(null);
    if (imageToSend) URL.revokeObjectURL(imageToSend.previewUrl);

    let imagePath: string | null = null;
    let imagePreviewUrl: string | null = null;

    try {
      // Upload image first (if any)
      if (imageToSend) {
        const ext = imageToSend.file.name.split('.').pop() || 'jpg';
        imagePath = `${adminId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(CHAT_IMAGE_BUCKET)
          .upload(imagePath, imageToSend.file, {
            upsert: false,
            contentType: imageToSend.file.type,
          });

        if (uploadError) throw uploadError;

        // Get a signed URL for local preview
        const urls = await signPaths(CHAT_IMAGE_BUCKET, [imagePath]);
        imagePreviewUrl = urls[imagePath] ?? null;
        if (imagePreviewUrl) {
          setImageUrls((prev) => ({ ...prev, [imagePath!]: imagePreviewUrl! }));
        }
      }

      const payload = {
        sender_id: adminId,
        receiver_id: targetFarmerId,
        content,
        image_path: imagePath,
      };

      const tempId = makeTempId();
      pendingTempIdsRef.current.add(tempId);

      const optimistic: Message = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setMessages((prev) => [...prev, optimistic]);

      setConversations((prev) =>
        prev.map((c) =>
          c.farmer.id === targetFarmerId
            ? { ...c, lastMessage: optimistic, unreadCount: 0 }
            : c,
        ),
      );

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // If realtime hasn't already reconciled, do it now
      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) {
            // Realtime already reconciled — just drop the temp
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? inserted : m));
        });
        pendingTempIdsRef.current.delete(tempId);

        setConversations((prev) =>
          prev.map((c) =>
            c.farmer.id === targetFarmerId
              ? { ...c, lastMessage: inserted, unreadCount: 0 }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert(
        `Failed to send message.\n\n${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
      // Roll back: remove any temp we added (best-effort)
      setMessages((prev) =>
        prev.filter((m) => !pendingTempIdsRef.current.has(m.id)),
      );
      pendingTempIdsRef.current.clear();
    } finally {
      sendingRef.current = false;
      setSending(false);
      setUploading(false);
    }
  };

  // ---- Pick image (staged, NOT sent) ----
  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image must be smaller than 5 MB.');
      return;
    }

    // Replace any previously staged image
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
  };

  const clearPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  // ---- Per-message edit ----
  const startEdit = (msg: Message) => {
    if (msg.sender_id !== adminId) return;
    if (msg.image_path) return;
    if (msg.id.startsWith('temp-')) return;
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const id = editingId;
    const nextContent = editContent.trim();
    const previous = messages;

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: nextContent } : m)),
    );
    setEditingId(null);
    setEditContent('');

    const { error } = await supabase
      .from('messages')
      .update({ content: nextContent })
      .eq('id', id);

    if (error) {
      console.error('Error editing message:', error);
      setMessages(previous);
      alert(`Failed to edit message.\n\n${error.message}`);
    }
  };

  // ---- Per-message delete ----
  const confirmDeleteMessage = async () => {
    if (!deletingMessageId) return;

    const id = deletingMessageId;
    const previous = messages;
    const target = previous.find((m) => m.id === id);

    setDeletingMessageId(null);
    setMessages((prev) => prev.filter((m) => m.id !== id));

    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      setMessages(previous);
      alert(`Failed to delete message.\n\n${error.message}`);
      return;
    }

    if (target?.image_path) {
      await supabase.storage
        .from(CHAT_IMAGE_BUCKET)
        .remove([target.image_path]);
      setImageUrls((prev) => {
        const next = { ...prev };
        delete next[target.image_path!];
        return next;
      });
    }

    if (activeFarmerId) {
      const remaining = previous.filter((m) => m.id !== id);
      const last = remaining[remaining.length - 1];

      if (last) {
        setConversations((prev) =>
          prev.map((c) =>
            c.farmer.id === activeFarmerId ? { ...c, lastMessage: last } : c,
          ),
        );
      } else {
        setConversations((prev) =>
          prev.filter((c) => c.farmer.id !== activeFarmerId),
        );
        setActiveFarmerId(null);
      }
    }
  };

  // ---- Delete entire conversation ----
  const handleDeleteConversation = async () => {
    if (!activeFarmerId || !adminId || deleting) return;

    setDeleting(true);

    try {
      // Delete both directions
      const { error: deleteMsgsError } = await supabase
        .from('messages')
        .delete()
        .or(
          `and(sender_id.eq.${activeFarmerId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${activeFarmerId})`,
        );

      if (deleteMsgsError) throw deleteMsgsError;

      // Delete associated storage objects
      const pathsToDelete = messages
        .map((m) => m.image_path)
        .filter((p): p is string => !!p);

      if (pathsToDelete.length > 0) {
        await supabase.storage.from(CHAT_IMAGE_BUCKET).remove(pathsToDelete);
      }

      setMessages([]);
      setImageUrls({});
      setConversations((prev) =>
        prev.filter((c) => c.farmer.id !== activeFarmerId),
      );
      setActiveFarmerId(null);
      setShowDeleteConversation(false);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert(
        `Failed to delete conversation.\n\n${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
    } finally {
      setDeleting(false);
    }
  };

  // ---- Helpers for rendering ----
  const getAvatarUrl = (farmer: FarmerLite): string | null => {
    if (!farmer.avatar_path) return null;
    return avatarUrls[farmer.avatar_path] ?? null;
  };

  const buildPreview = (last: Message): string => {
    const isMine = last.sender_id === adminId;
    const prefix = isMine ? 'You: ' : '';

    if (last.image_path && !last.content) {
      return `${prefix}📷 Photo`;
    }
    if (!last.content) {
      return `${prefix}📎 Attachment`;
    }
    const truncated =
      last.content.length > 40 ? `${last.content.slice(0, 40)}…` : last.content;
    return `${prefix}${truncated}`;
  };

  const filteredConversations = conversations.filter((c) =>
    c.farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="farmer-message-layout">
      {/* ================= LEFT: Conversation list ================= */}
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
              {searchTerm ? 'No farmers match your search.' : 'No messages yet.'}
            </p>
          ) : (
            filteredConversations.map((c) => {
              const avatarUrl = getAvatarUrl(c.farmer);
              const preview = buildPreview(c.lastMessage);

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
                    <span className="conversation-preview">{preview}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= RIGHT: Chat thread ================= */}
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

              <button
                className="chat-thread-delete-btn"
                onClick={() => setShowDeleteConversation(true)}
                aria-label="Delete conversation"
                type="button"
                title="Delete conversation"
              >
                <Trash2 size={18} />
              </button>
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
                  const imgUrl = m.image_path ? imageUrls[m.image_path] : null;
                  const isEditing = editingId === m.id;
                  const canEdit =
                    isAdmin && !m.image_path && !m.id.startsWith('temp-');

                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble-row ${
                        isAdmin
                          ? 'chat-bubble-row--sent'
                          : 'chat-bubble-row--received'
                      }`}
                    >
                      {canEdit && !isEditing && (
                        <div className="chat-bubble-actions">
                          <button
                            type="button"
                            className="chat-bubble-action-btn"
                            onClick={() => startEdit(m)}
                            aria-label="Edit message"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="chat-bubble-action-btn chat-bubble-action-btn--danger"
                            onClick={() => setDeletingMessageId(m.id)}
                            aria-label="Delete message"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`chat-bubble ${
                          isAdmin ? 'chat-bubble-sent' : 'chat-bubble-received'
                        }`}
                      >
                        {imgUrl && (
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-bubble-image-link"
                          >
                            <img
                              src={imgUrl}
                              alt="Attachment"
                              className="chat-bubble-image"
                            />
                          </a>
                        )}

                        {isEditing ? (
                          <div className="chat-bubble-edit">
                            <textarea
                              className="chat-bubble-edit-input"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  saveEdit();
                                }
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                              rows={2}
                            />
                            <div className="chat-bubble-edit-actions">
                              <button
                                type="button"
                                className="chat-bubble-edit-cancel"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="chat-bubble-edit-save"
                                onClick={saveEdit}
                                disabled={!editContent.trim()}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          m.content && <p>{m.content}</p>
                        )}

                        <span className="chat-bubble-time">
                          {new Date(m.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Staged image preview */}
            {pendingImage && (
              <div className="chat-thread-staged-image">
                <img src={pendingImage.previewUrl} alt="Selected" />
                <button
                  type="button"
                  className="chat-thread-staged-remove"
                  onClick={clearPendingImage}
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form className="chat-thread-input" onSubmit={handleSend}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="chat-thread-attach-btn"
                onClick={handleImagePick}
                disabled={uploading || sending}
                aria-label="Attach image"
                title="Attach image"
              >
                <ImagePlus size={18} />
              </button>

              <input
                type="text"
                placeholder={
                  uploading
                    ? 'Uploading image…'
                    : `Reply to ${activeFarmer.full_name}…`
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || uploading}
              />

              <button
                type="submit"
                disabled={
                  (!newMessage.trim() && !pendingImage) || sending || uploading
                }
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

      {/* ================= Delete conversation confirm ================= */}
      {showDeleteConversation && (
        <div
          className="delete-confirm-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteConversation(false);
            }
          }}
        >
          <div className="delete-confirm-dialog" role="alertdialog">
            <h3>Delete this conversation?</h3>
            <p>
              All messages with{' '}
              <strong>{activeFarmer?.full_name ?? 'this farmer'}</strong> will
              be permanently deleted. This action cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={() => setShowDeleteConversation(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleDeleteConversation}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Delete single message confirm ================= */}
      {deletingMessageId && (
        <div
          className="delete-confirm-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingMessageId(null);
          }}
        >
          <div className="delete-confirm-dialog" role="alertdialog">
            <h3>Delete this message?</h3>
            <p>This message will be permanently deleted.</p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={() => setDeletingMessageId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={confirmDeleteMessage}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}