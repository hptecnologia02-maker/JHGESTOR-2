import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { Send, User as UserIcon, Search, Shield, MessageSquare, Paperclip, FileIcon, ImageIcon, Smile, X, Plus, Users, Trash2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Attachment, ChatGroup, Message } from '../types';

const ChatView: React.FC = () => {
  const { user, messages = [], chatGroups = [], refreshData } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
  }, [user?.id]);

  // Mark as read when selection changes or messages update
  useEffect(() => {
    if (user && selectedUserId) {
      markAsRead(selectedUserId);
    }
  }, [selectedUserId, messages.length, user?.id]);

  const markAsRead = async (receiverId: string) => {
    if (!user) return;
    const hasUnread = messages.some(m =>
      m.receiverId === receiverId && !m.readBy?.includes(user.id)
    );
    if (hasUnread) {
      try {
        await api.markMessagesAsRead(receiverId, user.id);
        refreshData();
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  const loadUsers = async () => {
    if (!user?.ownerId) return;
    try {
      const allUsers = await api.getUsers(user.ownerId);
      setUsers((allUsers || []).filter(u => u.id !== user?.id));
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, selectedUserId]);

  const processFile = (file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: reader.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'file'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 600 * 1024 * 1024) {
        alert('Arquivo muito grande! O limite é 600MB.');
        return;
      }

      try {
        const attachment = await processFile(file);
        setAttachments(prev => [...prev, attachment]);
      } catch (err) {
        console.error("Erro ao ler arquivo", err);
        alert("Erro ao anexar arquivo.");
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && attachments.length === 0) || !user) return;

    try {
      await api.sendMessage({
        ownerId: user.ownerId,
        senderId: user.id,
        senderName: user.name,
        receiverId: selectedUserId,
        content: messageText,
        attachments: attachments
      });

      setMessageText('');
      setAttachments([]);
      setShowEmojiPicker(false);
      refreshData();
    } catch (e) {
      console.error("Failed to send message", e);
      alert("Erro ao enviar mensagem.");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;

    try {
      await api.createChatGroup({
        ownerId: user.ownerId,
        name: newGroupName,
        description: newGroupDescription,
        createdBy: user.id,
        members: [user.id, ...selectedMembers]
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedMembers([]);
      setShowGroupModal(false);
      refreshData();
    } catch (e) {
      console.error("Failed to create group", e);
      alert("Erro ao criar grupo.");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo? Todas as mensagens serão perdidas.')) {
      try {
        await api.deleteChatGroup(groupId);
        if (selectedUserId === groupId) {
          setSelectedUserId('ALL');
        }
        refreshData();
      } catch (e) {
        console.error("Failed to delete group", e);
      }
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const unreadCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (!user) return counts;

    (messages || []).forEach((m: Message) => {
      if (!m.readBy?.includes(user.id)) {
        counts[m.receiverId] = (counts[m.receiverId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, user?.id]);

  const filteredMessages = (messages || []).filter((msg: Message) => {
    if (selectedUserId === 'ALL') {
      return msg.receiverId === 'ALL';
    }
    if (selectedUserId.startsWith('group_')) {
      return msg.receiverId === selectedUserId;
    }
    // Conversa Privada: Eu sou o remetente e o outro o destinatário OR Inverso
    return (
      (msg.senderId === user?.id && msg.receiverId === selectedUserId) ||
      (msg.senderId === selectedUserId && msg.receiverId === user?.id)
    );
  });

  const isGroup = selectedUserId.startsWith('group_');
  const selectedGroup = isGroup ? (chatGroups || []).find(g => g.id === selectedUserId) : null;
  const selectedUserName = selectedUserId === 'ALL'
    ? 'Chat Geral JHGESTOR'
    : isGroup
      ? selectedGroup?.name || 'Grupo'
      : (users || []).find(u => u.id === selectedUserId)?.name || 'Usuário';

  const canManageGroup = selectedGroup && user?.role === 'ADMIN' && selectedGroup.createdBy === user?.id;

  const renderUnreadBadge = (id: string) => {
    const count = unreadCounts[id] || 0;
    if (count === 0) return null;
    return (
      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-in zoom-in">
        {count}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Sidebar de Conversas */}
      <div className={`
        lg:w-80 bg-white border rounded-2xl flex flex-col shadow-sm transition-all h-full
        ${selectedUserId && window.innerWidth < 1024 ? 'hidden' : 'flex w-full'}
        lg:flex
      `}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2 text-slate-700"><Shield size={16} /> Conversas</h4>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowGroupModal(true)}
                className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                title="Criar Grupo"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="relative text-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input placeholder="Buscar conversas..." className="w-full pl-9 pr-4 py-2 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div
            onClick={() => setSelectedUserId('ALL')}
            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 border transition-colors mb-2 ${selectedUserId === 'ALL' ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50 border-transparent'}`}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xs flex-shrink-0">G</div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm text-blue-900">Chat Geral</p>
                {renderUnreadBadge('ALL')}
              </div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest truncate">Todos os usuários</p>
            </div>
          </div>

          {(chatGroups || []).length > 0 && (
            <div className="mt-4 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grupos</span>
              <div className="mt-2 space-y-1">
                {chatGroups.map(g => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedUserId(g.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 group transition-colors ${selectedUserId === g.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 block truncate">{g.name}</span>
                        {renderUnreadBadge(g.id)}
                      </div>
                      <span className="text-[9px] text-gray-400">{g.members?.length || 0} membros</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 px-2 pb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contatos</span>
            <div className="mt-2 space-y-1">
              {(users || []).map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 group transition-colors ${selectedUserId === u.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-700 block truncate">{u.name}</span>
                      {renderUnreadBadge(u.id)}
                    </div>
                    <span className="text-[9px] text-gray-400">{u.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Área da Conversa */}
      <div className={`
        flex-1 bg-white border rounded-2xl lg:flex flex-col shadow-sm overflow-hidden h-full
        ${!selectedUserId && window.innerWidth < 1024 ? 'hidden' : 'flex'}
      `}>
        <div className="p-3 md:p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSelectedUserId('')}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white text-xs md:text-sm font-black shadow-lg flex-shrink-0 ${selectedUserId === 'ALL' ? 'bg-blue-600 shadow-blue-100' : isGroup ? 'bg-gradient-to-br from-green-400 to-teal-500' : 'bg-gradient-to-br from-purple-400 to-blue-500'}`}>
              {selectedUserId === 'ALL' ? 'G' : isGroup ? <Users size={18} /> : selectedUserName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs md:text-sm text-slate-800 tracking-tight truncate">{selectedUserName}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[8px] md:text-[10px] text-green-600 font-black uppercase tracking-widest truncate">
                  {selectedUserId === 'ALL' ? 'Tempo Real' : isGroup ? `${selectedGroup?.members?.length || 0} membros` : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canManageGroup && (
              <button
                onClick={() => handleDeleteGroup(selectedUserId)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Excluir grupo"
              >
                <Trash2 size={18} />
              </button>
            )}
            {window.innerWidth < 1024 && (
              <button
                onClick={() => setSelectedUserId('')}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/20">
          {filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 opacity-60">
              <MessageSquare size={48} className="animate-bounce" />
              <p className="text-xs md:text-sm font-bold text-center">Nenhuma mensagem ainda.<br />Que tal dar um oi?</p>
            </div>
          )}
          {filteredMessages.map((msg: Message) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] md:max-w-[80%] p-3 md:p-4 shadow-sm relative ${msg.senderId === user?.id ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-white border text-slate-800 rounded-2xl rounded-tl-none'}`}>
                {msg.senderId !== user?.id && <p className="text-[9px] font-black mb-1 text-blue-600 uppercase tracking-widest">{msg.senderName}</p>}
                {msg.content && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att: Attachment) => (
                      att.type === 'image' ? (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={att.url} className="max-w-full rounded-lg border-2 border-white/20 hover:scale-[1.02] transition-transform" alt={att.name} />
                        </a>
                      ) : (
                        <a key={att.id} href={att.url} download={att.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border text-[10px] md:text-xs font-bold ${msg.senderId === user?.id ? 'bg-blue-700 border-blue-500 hover:bg-blue-800' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'}`}>
                          <FileIcon size={14} />
                          <span className="truncate max-w-[150px]">{att.name}</span>
                        </a>
                      )
                    ))}
                  </div>
                )}
                <div className={`text-[8px] mt-1.5 font-bold uppercase tracking-tighter opacity-70 flex justify-end`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 md:p-4 bg-white border-t">
          {(attachments || []).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map(att => (
                <div key={att.id} className="relative group">
                  {att.type === 'image' ? (
                    <img src={att.url} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border" alt={att.name} />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-100 flex flex-col items-center justify-center border text-gray-500">
                      <FileIcon size={16} />
                      <span className="text-[7px] md:text-[8px] mt-1 truncate w-10 md:w-14 text-center">{att.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 md:gap-3 relative items-end">
            <div className="flex gap-1 md:gap-2 mb-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-500 p-2 md:p-3 rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="bg-gray-100 text-gray-500 p-2 md:p-3 rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              >
                <Smile size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex-1 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-0 z-50 transform scale-75 md:scale-100 origin-bottom-left">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 1024) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                placeholder="Mensagem..."
                rows={1}
                className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none overflow-hidden"
                style={{ height: 'auto', minHeight: '44px' }}
              />
            </div>

            <button type="submit" className="bg-blue-600 text-white p-2.5 md:p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 mb-0.5 flex-shrink-0">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Modal Criar Grupo */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Criar Grupo</h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Grupo</label>
                <input
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Equipe de Vendas"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sobre o que é este grupo..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adicionar Membros</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-xl p-2">
                  {(users || []).map(u => (
                    <div
                      key={u.id}
                      onClick={() => toggleMemberSelection(u.id)}
                      className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${selectedMembers.includes(u.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium flex-1">{u.name}</span>
                      {selectedMembers.includes(u.id) && <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Criar Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
