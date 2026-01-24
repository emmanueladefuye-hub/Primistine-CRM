import React, { createContext, useContext, useMemo } from 'react';
import { db, rtdb } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, orderBy, serverTimestamp, query, where, onSnapshot, limit } from 'firebase/firestore';
import { ref, set, onValue, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { useAuth } from './AuthContext';
import { useCollection } from '../hooks/useFirestore';
import { usePaginatedCollection } from '../hooks/usePaginatedCollection';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

const MessagesContext = createContext();

export function useMessages() {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
}

export function MessagesProvider({ children }) {
    const { currentUser, userProfile } = useAuth();
    // Unified Hook-based collections (CRM-wide fix)
    const { data: channels, loading: channelsLoading } = useCollection('channels');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({}); // { threadId: { userId: true } }

    // Paginated messages listener (Phase 2)
    const messagesQuery = useMemo(() => {
        if (!currentUser || !userProfile) return null;
        if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
            return [orderBy('createdAt', 'desc')];
        }
        return [
            where('participants', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc')
        ];
    }, [currentUser, userProfile]);

    const {
        data: pagedMessages,
        loading: messagesLoading,
        hasMore: messagesHasMore,
        loadMore: loadMoreMessages
    } = usePaginatedCollection('messages', messagesQuery || [], 30);

    useEffect(() => {
        if (currentUser && messagesQuery) {
            loadMoreMessages(true);
        }
    }, [currentUser, messagesQuery]);

    // Live Messages (Top 10 for notifications/sync)
    const liveMessagesQuery = React.useMemo(() => {
        if (!messagesQuery) return null;
        return [...messagesQuery, limit(10)];
    }, [messagesQuery]);

    const { data: liveMsgs } = useCollection(liveMessagesQuery ? 'messages' : null, liveMessagesQuery || []);

    useEffect(() => {
        if (liveMsgs?.length > 0) {
            setMessages(prev => {
                const combined = [...liveMsgs, ...prev];
                return Array.from(new Map(combined.map(m => [m.id, m])).values())
                    .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
            });
            setLoading(false);
        } else if (liveMsgs) {
            setLoading(false);
        }
    }, [liveMsgs]);

    // Real-time typing indicators
    useEffect(() => {
        if (!currentUser) return;
        const typingRef = ref(rtdb, 'typing');
        const unsubscribe = onValue(typingRef, (snapshot) => {
            setTypingUsers(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, [currentUser]);

    const setTyping = (threadId, isTyping) => {
        if (!currentUser) return;
        const userTypingRef = ref(rtdb, `typing/${threadId}/${currentUser.uid}`);
        set(userTypingRef, isTyping ? true : null);
    };

    const markAsRead = async (messageId) => {
        try {
            const docRef = doc(db, 'messages', messageId);
            await updateDoc(docRef, { unread: false });
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    };

    const sendMessage = async (messageData) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("User session lost. Please refresh.");
            return;
        }

        try {
            // Validation
            if (!messageData.body?.trim()) {
                toast.error("Message body is empty");
                return;
            }

            const participants = [currentUser.uid];
            if (messageData.recipientId && messageData.recipientId !== currentUser.uid) {
                participants.push(messageData.recipientId);
            }

            // Clean participants (filter out nulls/duplicates)
            const cleanParticipants = [...new Set(participants)].filter(Boolean);

            const newMessage = {
                subject: messageData.subject || "No Subject",
                body: messageData.body.trim(),
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email || "Unknown",
                participants: cleanParticipants,
                createdAt: serverTimestamp(),
                unread: true,
                tag: messageData.tag || 'Internal',
                threadId: messageData.threadId || `thread_${Date.now()}`,
                leadId: messageData.leadId || null,
                projectId: messageData.projectId || null,
                replyToId: messageData.replyToId || null,
                attachments: messageData.attachments || []
            };

            console.log("Attempting to send message:", newMessage);

            const docRef = await addDoc(collection(db, 'messages'), newMessage);
            setTyping(newMessage.threadId, false);
            toast.success('Message sent');
            return docRef.id;
        } catch (err) {
            console.error('CRITICAL: sendMessage failed:', err);

            if (err.code === 'permission-denied') {
                toast.error('Identity permission error. Try re-logging.');
            } else if (err.message?.includes('index')) {
                toast.error('Firestore optimization in progress. Try in 1 minute.');
            } else {
                toast.error(`Send Failed: ${err.message || 'Unknown error'}`);
            }
            throw err;
        }
    };

    const createChannel = async (channelData) => {
        if (userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
            toast.error("Unauthorized to create channels");
            return;
        }
        try {
            const newChannel = {
                ...channelData,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            };
            await addDoc(collection(db, 'channels'), newChannel);
            toast.success(`Channel #${channelData.name} created`);
        } catch (err) {
            console.error("Channel create error:", err);
            toast.error("Failed to create channel");
        }
    };

    return (
        <MessagesContext.Provider value={{
            messages,
            channels,
            loading,
            sendMessage,
            markAsRead,
            setTyping,
            typingUsers,
            createChannel
        }}>
            {children}
        </MessagesContext.Provider>
    );
}
