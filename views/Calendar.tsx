
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../db';
// Added Calendar to imports to fix "Cannot find name 'Calendar'"
import { Plus, ChevronLeft, ChevronRight, Share2, X, Clock, MapPin, Calendar, RefreshCw, LogOut } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { user, events, refreshData } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  console.log("Calendar Debug - User state:", { connected: user?.googleCalendarConnected, name: user?.name });
  const googleAccountName = user?.googleCalendarConnected ? `${user.name} (Google Sync)` : null;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      // Clean up logic if needed, usually script persists
    }
  }, []);

  const fetchGoogleEvents = async (token: string, silent = false) => {
    try {
      // Sincronizar o ano inteiro (Janeiro a Dezembro)
      const year = currentDate.getFullYear();
      const timeMin = new Date(year, 0, 1, 0, 0, 0).toISOString();
      const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        throw new Error('Token expirado');
      }

      if (!response.ok) throw new Error('Falha na requisição');

      const data = await response.json();

      const googleEvents = (data.items || []).map((item: any) => ({
        id: 'G_' + item.id,
        googleEventId: item.id,
        ownerId: user?.ownerId,
        userId: user?.id,
        title: item.summary || '(Sem título)',
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        description: item.description || '',
        isGoogleEvent: true
      }));

      if (user && user.id) {
        if (!silent) window.alert(`Sincronizando ${googleEvents.length} eventos do ano de ${year}...`);

        await api.mergeGoogleEvents(user.id, googleEvents, token, timeMin);
        await refreshData();
      }
      return true;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      if (!silent) throw error;
      return false;
    }
  };

  const handleLocalRefresh = async () => {
    setIsLoadingGoogle(true);
    try {
      if (user?.googleAccessToken) {
        console.log('Atualizando agenda Google automaticamente...');
        await fetchGoogleEvents(user.googleAccessToken, true);
      }
      await refreshData();
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Deseja desconectar sua conta Google Calendar?') && user) {
      await api.disconnectGoogle(user.id);
      await refreshData();
    }
  };

  const handleSyncGoogle = () => {
    // @ts-ignore
    if (typeof google === 'undefined' || !google.accounts) {
      alert('Erro: Serviço do Google não carregado. Verifique sua conexão.');
      return;
    }

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '171329732540-2lqud15qp8mbppo5kkbvn5b6u5nps4fk.apps.googleusercontent.com';
    setIsLoadingGoogle(true);
    console.log("handleSyncGoogle: Starting Unified Flow...");

    // @ts-ignore
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile',
      prompt: 'consent', // FORÇA a tela de "Continuar/Permitir" e a escolha de conta
      callback: async (tokenResponse: any) => {
        console.log('Google Token Response:', tokenResponse);
        if (tokenResponse && tokenResponse.access_token) {
          try {
            await fetchGoogleEvents(tokenResponse.access_token);
            window.alert("Sincronização concluída com sucesso! Verifique os eventos.");
          } catch (e: any) {
            console.error('Erro na sincronização:', e);
            window.alert('Erro ao processar: ' + (e.message || 'Falha no banco de dados'));
          }
        } else {
          console.warn("Google não retornou token.");
        }
        setIsLoadingGoogle(false);
      },
    });

    client.requestAccessToken();
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    await api.addEvent({
      ownerId: user?.ownerId || '1',
      userId: user?.id || '1',
      title: formData.get('title') as string,
      start: `${date}T${time}:00`,
      end: `${date}T${time}:00`,
      description: formData.get('description') as string,
    });

    setIsModalOpen(false);
    refreshData();
  };

  const getEventsForDay = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().substring(0, 10);
    return events.filter(e => e.start.startsWith(checkDate));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <p className="text-sm text-gray-500 font-medium">Gestão de Agenda Corporativa</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-white rounded-lg transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-white rounded-lg transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            {!googleAccountName ? (
              <>
                <button
                  onClick={handleLocalRefresh}
                  className="bg-white border text-gray-600 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                  title="Recarregar eventos locais"
                >
                  <RefreshCw size={18} className={isLoadingGoogle ? 'animate-spin' : ''} />
                  Atualizar
                </button>
                <button
                  onClick={handleSyncGoogle}
                  disabled={isLoadingGoogle}
                  className={`flex-1 sm:flex-none bg-white border text-blue-600 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-50 transition-colors shadow-sm ${isLoadingGoogle ? 'opacity-70 cursor-wait' : ''}`}
                  title="Conectar com Google Calendar"
                >
                  <Share2 size={18} /> Google
                </button>
              </>
            ) : (
              <>
                <div className="flex bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl items-center justify-center gap-2 font-bold cursor-default select-none shadow-sm mr-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="hidden md:inline">Google Conectado</span>
                </div>

                <button
                  onClick={handleLocalRefresh}
                  className="bg-white border text-gray-600 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                  title="Recarregar eventos"
                >
                  <RefreshCw size={18} className={isLoadingGoogle ? 'animate-spin' : ''} />
                  Atualizar
                </button>

                <button
                  onClick={handleSyncGoogle}
                  disabled={isLoadingGoogle}
                  className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-100 transition-colors shadow-sm"
                  title="Sincronizar novos eventos do Google"
                >
                  <Share2 size={18} />
                  Sincronizar
                </button>

                <button
                  onClick={handleDisconnectGoogle}
                  className="bg-white border text-red-500 px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-red-50 transition-colors shadow-sm"
                  title="Desconectar Google"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={18} /> Novo Evento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[600px]">
          {blanks.map(i => <div key={`b-${i}`} className="border-b border-r bg-gray-50/30"></div>)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day} className="border-b border-r p-2 hover:bg-gray-50 transition-colors group relative min-h-[120px]">
                <span className={`text-sm font-black ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
                  {day}
                </span>
                <div className="mt-2 space-y-1">
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-1 text-[10px] font-bold rounded border truncate cursor-pointer hover:scale-105 transition-transform ${ev.isGoogleEvent
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                      title={ev.isGoogleEvent ? 'Evento do Google Calendar' : 'Evento Local'}
                    >
                      {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Agendar Compromisso</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título do Evento</label>
                <input required name="title" autoFocus className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Reunião de Fechamento" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14} /> Data</label>
                  <input required name="date" type="date" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={14} /> Hora</label>
                  <input required name="time" type="time" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição / Local</label>
                <textarea name="description" rows={3} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes da reunião..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">Criar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 border-b flex justify-between items-start ${selectedEvent.isGoogleEvent ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <div>
                <h3 className={`text-xl font-bold ${selectedEvent.isGoogleEvent ? 'text-orange-900' : 'text-blue-900'}`}>{selectedEvent.title}</h3>
                {selectedEvent.isGoogleEvent && <span className="inline-block mt-1 px-2 py-0.5 bg-white text-orange-600 text-[10px] font-bold rounded-full border border-orange-200">GOOGLE CALENDAR</span>}
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 bg-white/50 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Início</span>
                  <div className="font-bold text-gray-700 text-sm">
                    {new Date(selectedEvent.start).toLocaleDateString()} <br />
                    {new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Fim</span>
                  <div className="font-bold text-gray-700 text-sm">
                    {new Date(selectedEvent.end).toLocaleDateString()} <br />
                    {new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border min-h-[100px]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Descrição</span>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedEvent.description || 'Sem descrição.'}</p>
              </div>

              {!selectedEvent.isGoogleEvent && (
                <div className="pt-2">
                  <p className="text-xs text-center text-gray-400">Este é um evento local do sistema.</p>
                </div>
              )}

              {selectedEvent.isGoogleEvent && (
                <div className="pt-2">
                  <p className="text-xs text-center text-orange-400 font-medium">Sincronizado do Google Calendar</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="px-6 py-2 bg-white border rounded-xl font-bold text-gray-600 hover:bg-gray-100 shadow-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
