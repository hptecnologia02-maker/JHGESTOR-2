
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { Plus, Clock, MessageSquare, User, X, Send, MoreHorizontal, Trash2, Paperclip, FileIcon, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, TaskStatus, Attachment } from '../types';

const TasksView: React.FC = () => {
  const { tasks, refreshData, user } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('ALL');

  // Attachment States
  const [newTaskAttachments, setNewTaskAttachments] = useState<Attachment[]>([]);
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.ownerId) return;
      const allUsers = await api.getUsers(user.ownerId);
      setUsers(allUsers || []);
    };
    fetchUsers();
  }, [user?.ownerId]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, target: 'TASK' | 'COMMENT') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // User requested 600MB limit. Note: LocalStorage will likely fail > 5MB.
      if (file.size > 600 * 1024 * 1024) {
        alert('Arquivo muito grande! O limite é 600MB.');
        return;
      }

      try {
        const attachment = await processFile(file);
        if (target === 'TASK') {
          setNewTaskAttachments(prev => [...prev, attachment]);
        } else {
          setCommentAttachments(prev => [...prev, attachment]);
        }
      } catch (err) {
        console.error("Erro ao ler arquivo", err);
        alert("Erro ao anexar arquivo.");
      }
    }
  };

  const renderAttachments = (attachments?: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map(att => (
          <a key={att.id} href={att.url} download={att.name} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors border text-xs font-medium text-gray-700" title={att.name}>
            {att.type === 'image' ? <ImageIcon size={14} className="text-purple-500" /> : <FileIcon size={14} className="text-blue-500" />}
            <span className="truncate max-w-[150px]">{att.name}</span>
          </a>
        ))}
      </div>
    );
  };

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'PENDING', label: 'Pendente', color: 'bg-gray-100 border-gray-200' },
    { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-blue-50 border-blue-100' },
    { id: 'COMPLETED', label: 'Concluído', color: 'bg-green-50 border-green-100' },
  ];

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    await api.updateTask(taskId, { status: newStatus });
    refreshData();
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await api.addTask({
      ownerId: user?.ownerId || '1',
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: 'PENDING',
      responsibleId: formData.get('responsibleId') as string,
      deadline: formData.get('deadline') as string,
      attachments: newTaskAttachments
    });
    setNewTaskAttachments([]);
    setIsModalOpen(false);
    refreshData();
  };

  const handleAddComment = async () => {
    if (!selectedTask || (!commentText.trim() && commentAttachments.length === 0) || !user) return;
    await api.addTaskComment(selectedTask.id, {
      userId: user.id,
      userName: user.name,
      content: commentText,
      attachments: commentAttachments
    });
    setCommentText('');
    setCommentAttachments([]);

    const updatedTasks = await api.getTasks(user.ownerId);
    const updatedTask = updatedTasks.find(t => t.id === selectedTask.id);
    if (updatedTask) setSelectedTask(updatedTask);
    refreshData();
  };

  const filteredTasks = tasks.filter(task =>
    responsibleFilter === 'ALL' || task.responsibleId === responsibleFilter
  );

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold">Quadro Kanban</h3>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="ALL">Todos os Responsáveis</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto md:overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex flex-col md:flex-row md:grid md:grid-cols-3 gap-6 h-full">
          {columns.map((col, index) => (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border p-3 md:p-4 ${col.color} w-full md:w-auto transition-colors mb-6 md:mb-0`}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-2', 'ring-blue-300', 'ring-offset-1');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('ring-2', 'ring-blue-300', 'ring-offset-1');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-blue-300', 'ring-offset-1');
                const droppedId = e.dataTransfer.getData('taskId');
                if (droppedId) handleMoveTask(droppedId, col.id);
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-gray-500">{col.label}</span>
                <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">{filteredTasks.filter(t => t.status === col.id).length}</span>
              </div>
              <div className="space-y-3 md:space-y-4 flex-1">
                {filteredTasks.filter(t => t.status === col.id).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">{task.title}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Excluir esta tarefa?')) {
                              api.deleteTask(task.id);
                              refreshData();
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded"
                          title="Excluir tarefa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 md:mb-4 leading-relaxed">{task.description}</p>

                    {/* Attachments Preview in Card */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex gap-1 mb-3 overflow-x-auto py-1 scrollbar-hide">
                        {task.attachments.slice(0, 3).map(att => (
                          att.type === 'image' ? (
                            <img key={att.id} src={att.url} className="w-7 h-7 md:w-8 md:h-8 rounded object-cover border" alt="anexo" />
                          ) : (
                            <div key={att.id} className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-100 flex items-center justify-center border text-gray-500"><FileIcon size={10} /></div>
                          )
                        ))}
                        {task.attachments.length > 3 && (
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-100 flex items-center justify-center border text-[9px] font-bold text-gray-500">+{task.attachments.length - 3}</div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 md:py-1 rounded w-fit">
                          <Clock size={10} /> {new Date(task.deadline).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit border border-blue-100 uppercase tracking-tighter md:tracking-normal">
                          <User size={8} /> {users.find(u => u.id === task.responsibleId)?.name || 'Sem responsável'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0">
                        {/* Mobile Status Move Arrows */}
                        <div className="flex gap-1">
                          {index > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTask(task.id, columns[index - 1].id);
                              }}
                              className="md:hidden p-1.5 bg-gray-100 text-gray-600 rounded-lg active:bg-blue-100"
                              title="Mover para coluna anterior"
                            >
                              <ChevronLeft size={16} />
                            </button>
                          )}
                          {index < columns.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTask(task.id, columns[index + 1].id);
                              }}
                              className="md:hidden p-1.5 bg-gray-100 text-gray-600 rounded-lg active:bg-blue-100"
                              title="Mover para próxima coluna"
                            >
                              <ChevronRight size={16} />
                            </button>
                          )}
                        </div>

                        {(task.comments.length > 0 || (task.attachments && task.attachments.length > 0)) && (
                          <div className="flex items-center gap-2">
                            {task.attachments && task.attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-purple-500 font-bold"><Paperclip size={10} /> {task.attachments.length}</span>
                            )}
                            {task.comments.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                                <MessageSquare size={10} /> {task.comments.length}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">O que precisa ser feito?</label>
                <input required name="title" autoFocus className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Título da tarefa..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição detalhada</label>
                <textarea required name="description" rows={3} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Explique os detalhes..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Anexos</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors">
                    <Paperclip size={16} /> Anexar Arquivo
                    <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'TASK')} />
                  </label>
                  <span className="text-[10px] text-gray-400">Max 600MB</span>
                </div>
                {renderAttachments(newTaskAttachments)}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Responsável</label>
                <select
                  required
                  name="responsibleId"
                  defaultValue={user?.id}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data Limite</label>
                <input required name="deadline" type="date" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Salvar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes e Comentários */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${selectedTask.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedTask.status === 'PENDING' ? 'Pendente' :
                    selectedTask.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Concluído'}
                </span>
                <h3 className="text-xl font-bold mt-1">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">
                    {users.find(u => u.id === selectedTask.responsibleId)?.name.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    Responsável: <span className="text-blue-600 font-bold">{users.find(u => u.id === selectedTask.responsibleId)?.name || 'Sem responsável'}</span>
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Descrição</h5>
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-700 mb-3">{selectedTask.description}</p>
                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Anexos da Tarefa</span>
                      {renderAttachments(selectedTask.attachments)}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Comentários e Histórico</h5>
                <div className="space-y-4">
                  {selectedTask.comments.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-4">Nenhum comentário ainda. Comece a conversa!</p>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">
                          {c.userName.charAt(0)}
                        </div>
                        <div className="flex-1 bg-gray-50 p-3 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold">{c.userName}</span>
                            <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-gray-600">{c.content}</p>
                          {c.attachments && c.attachments.length > 0 && (
                            <div className="mt-2">
                              {renderAttachments(c.attachments)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t bg-gray-50">
              {commentAttachments.length > 0 && (
                <div className="mb-2 px-1">
                  {renderAttachments(commentAttachments)}
                </div>
              )}
              <div className="flex gap-2">
                <label className="bg-gray-100 hover:bg-gray-200 text-gray-500 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors" title="Anexar arquivo">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'COMMENT')} />
                </label>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário ou use @menção..."
                  className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
