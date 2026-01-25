import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { TrendingUp, Users, Eye, Target, RefreshCw, Facebook, AlertCircle, CheckCircle, LogOut, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { initFacebookSdk, loginWithFacebook, getAdAccounts, getInsights, getCampaigns, getAdSets, getAds } from '../services/facebook';

const AdsView: React.FC = () => {
  const { adsMetrics, refreshData, user } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAdSetId, setSelectedAdSetId] = useState('');
  const [selectedAdId, setSelectedAdId] = useState('');

  const [realMetrics, setRealMetrics] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [datePreset, setDatePreset] = useState('last_30d');
  const [customRange, setCustomRange] = useState({ since: '', until: '' });

  // Lead detection helper (internal)
  const getLeadsFromActions = (metrics: any) => {
    if (!metrics || !metrics.actions) return 0;
    const leadTypes = ['lead', 'on_facebook_lead', 'offsite_conversion.fb_pixel_lead', 'contact', 'submit_application', 'complete_registration', 'subscribe', 'messaging'];
    const leadActions = metrics.actions.filter((a: any) =>
      leadTypes.some(type => a.action_type.toLowerCase().includes(type))
    );
    return leadActions.reduce((sum: number, a: any) => sum + Math.round(parseFloat(a.value || 0)), 0);
  };

  // Cost per lead helper (internal)
  const getMetaCostPerLead = (metrics: any) => {
    if (!metrics || !metrics.cost_per_action_type) return null;
    const leadTypes = ['lead', 'on_facebook_lead', 'offsite_conversion.fb_pixel_lead', 'contact', 'complete_registration', 'messaging'];
    const leadCost = metrics.cost_per_action_type.find((a: any) =>
      leadTypes.some(type => a.action_type.toLowerCase().includes(type))
    );
    return leadCost ? parseFloat(leadCost.value) : null;
  };

  const translateActionType = (type: string) => {
    const map: { [key: string]: string } = {
      'lead': 'Leads',
      'on_facebook_lead': 'Leads (Nativos)',
      'offsite_conversion.fb_pixel_lead': 'Leads (Pixel)',
      'link_click': 'Cliques no Link',
      'post_engagement': 'Engajamento com Post',
      'post_reaction': 'Reações',
      'comment': 'Comentários',
      'contact': 'Contatos',
      'messaging_conversation_started_7d': 'Conversas Iniciadas',
      'complete_registration': 'Cadastros Completos',
      'landing_page_view': 'Visualizações de Página',
      'video_view': 'Visualizações de Vídeo'
    };
    return map[type.toLowerCase()] || type;
  };

  const fetchData = async (objectId: string, token: string, level: any, preset: string = 'last_30d', custom: any = null) => {
    if (!objectId) return;
    setIsSyncing(true);
    setErrorMsg('');
    try {
      const dateParams = preset === 'custom' && custom?.since && custom?.until
        ? { time_range: { since: custom.since, until: custom.until } }
        : { date_preset: preset };

      const data = await getInsights(objectId, token, level, dateParams);
      setRealMetrics(data || { _noData: true });
    } catch (e: any) {
      console.error("Erro ao baixar insights", e);
      const msg = e.message || 'Erro de conexão com Meta API';
      const subMsg = e.error_user_msg || '';
      setErrorMsg(`Erro: ${msg}. ${subMsg}`);
      setRealMetrics(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadInitialData = async (accountId: string, token: string) => {
    await fetchData(accountId, token, 'account', datePreset);
    await loadCampaigns(accountId, token);
  };

  const loadAccounts = async (token: string) => {
    try {
      const accounts = await getAdAccounts(token);
      setAdAccounts(accounts);
    } catch (e) {
      console.error("Erro ao carregar contas", e);
    }
  };

  const loadCampaigns = async (accountId: string, token: string) => {
    try {
      const data = await getCampaigns(accountId, token);
      setCampaigns(data);
    } catch (e) {
      console.error("Erro ao carregar campanhas", e);
    }
  };

  // Initial Load
  useEffect(() => {
    if (!user?.ownerId) return;
    initFacebookSdk();

    // FIX: getMetaConfig é async, precisa de await
    (async () => {
      const config = await api.getMetaConfig(user.ownerId);
      if (config.accessToken) {
        setIsConnected(true);
        if (config.adAccountId) {
          setSelectedAccountId(config.adAccountId);
          await loadInitialData(config.adAccountId, config.accessToken);
        }
        await loadAccounts(config.accessToken);
      }
    })();
  }, [user?.ownerId]);

  const handleConnect = async () => {
    try {
      setErrorMsg('');
      const { accessToken } = await loginWithFacebook();
      setIsConnected(true);
      if (user?.ownerId) {
        api.saveMetaConfig(user.ownerId, accessToken, '', '');
      }
      await loadAccounts(accessToken);
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao conectar com Facebook.');
    }
  };

  const handleAccountSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    setSelectedCampaignId('');
    setSelectedAdSetId('');
    setSelectedAdId('');
    setCampaigns([]);
    setAdSets([]);
    setAds([]);

    const account = adAccounts.find(a => a.id === accountId);
    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    if (config.accessToken && accountId) {
      await api.saveMetaConfig(user.ownerId, config.accessToken, accountId, account?.name || '');
      await fetchData(accountId, config.accessToken, 'account', datePreset);
      await loadCampaigns(accountId, config.accessToken);
    }
  };

  const handleCampaignSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value;
    setSelectedCampaignId(campaignId);
    setSelectedAdSetId('');
    setSelectedAdId('');
    setAdSets([]);
    setAds([]);

    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    if (config.accessToken && campaignId) {
      await fetchData(campaignId, config.accessToken, 'campaign', datePreset);
      const data = await getAdSets(campaignId, config.accessToken);
      setAdSets(data);
    } else if (config.accessToken && selectedAccountId) {
      await fetchData(selectedAccountId, config.accessToken, 'account', datePreset);
    }
  };

  const handleAdSetSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const adSetId = e.target.value;
    setSelectedAdSetId(adSetId);
    setSelectedAdId('');
    setAds([]);

    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    if (config.accessToken && adSetId) {
      await fetchData(adSetId, config.accessToken, 'adset', datePreset);
      const data = await getAds(adSetId, config.accessToken);
      setAds(data);
    } else if (config.accessToken && selectedCampaignId) {
      await fetchData(selectedCampaignId, config.accessToken, 'campaign', datePreset);
    }
  };

  const handleAdSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const adId = e.target.value;
    setSelectedAdId(adId);

    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    if (config.accessToken && adId) {
      await fetchData(adId, config.accessToken, 'ad', datePreset);
    } else if (config.accessToken && selectedAdSetId) {
      await fetchData(selectedAdSetId, config.accessToken, 'adset', datePreset);
    }
  };

  const handleRefresh = async () => {
    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    const currentLevel = selectedAdId ? 'ad' : selectedAdSetId ? 'adset' : selectedCampaignId ? 'campaign' : 'account';
    const currentId = selectedAdId || selectedAdSetId || selectedCampaignId || selectedAccountId;

    if (currentId && config.accessToken) {
      await fetchData(currentId, config.accessToken, currentLevel, datePreset, customRange);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPreset = e.target.value;
    setDatePreset(newPreset);
    if (newPreset === 'custom') return;

    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    const currentLevel = selectedAdId ? 'ad' : selectedAdSetId ? 'adset' : selectedCampaignId ? 'campaign' : 'account';
    const currentId = selectedAdId || selectedAdSetId || selectedCampaignId || selectedAccountId;

    if (currentId && config.accessToken) {
      await fetchData(currentId, config.accessToken, currentLevel, newPreset);
    }
  };

  const handleCustomRangeChange = (type: 'since' | 'until', value: string) => {
    setCustomRange(prev => ({ ...prev, [type]: value }));
  };

  const applyCustomRange = async () => {
    if (!customRange.since || !customRange.until) return;
    if (!user?.ownerId) return;
    const config = await api.getMetaConfig(user.ownerId);
    const currentLevel = selectedAdId ? 'ad' : selectedAdSetId ? 'adset' : selectedCampaignId ? 'campaign' : 'account';
    const currentId = selectedAdId || selectedAdSetId || selectedCampaignId || selectedAccountId;

    if (currentId && config.accessToken) {
      await fetchData(currentId, config.accessToken, currentLevel, 'custom', customRange);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Desconectar?') && user?.ownerId) {
      api.clearMetaConfig(user.ownerId);
      setIsConnected(false);
      setAdAccounts([]);
      setCampaigns([]);
      setAdSets([]);
      setAds([]);
      setSelectedAccountId('');
      setSelectedCampaignId('');
      setSelectedAdSetId('');
      setSelectedAdId('');
      setRealMetrics(null);
    }
  };

  const isUsingRealData = realMetrics !== null && !realMetrics._noData;
  const leads = isUsingRealData ? getLeadsFromActions(realMetrics) : (isConnected ? 0 : (adsMetrics?.leads || 0));
  const spend = isUsingRealData ? (parseFloat(realMetrics.spend) || 0) : 0;
  const metaCPL = isUsingRealData ? getMetaCostPerLead(realMetrics) : null;
  const costPerLead = metaCPL !== null ? metaCPL : (leads > 0 ? (spend / leads) : 0);

  const displayMetrics = {
    leads,
    reach: isUsingRealData ? parseInt(realMetrics.reach || 0) : (isConnected ? 0 : (adsMetrics?.reach || 0)),
    impressions: isUsingRealData ? parseInt(realMetrics.impressions || 0) : (isConnected ? 0 : (adsMetrics?.impressions || 0)),
    spend,
    costPerLead
  };

  const downloadPDFReport = async () => {
    if (!user?.ownerId) return;
    const doc = new jsPDF();
    const config = await api.getMetaConfig(user.ownerId);
    const accountName = config.adAccountName || 'Conta não selecionada';
    const itemName = selectedAdId ? ads.find(a => a.id === selectedAdId)?.name
      : selectedAdSetId ? adSets.find(as => as.id === selectedAdSetId)?.name
        : selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId)?.name
          : 'Visão Geral da Conta';

    doc.setFontSize(20);
    doc.setTextColor(24, 119, 242);
    doc.text('Relatório Meta Ads - JHGestor', 14, 22);

    autoTable(doc, {
      startY: 55,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Leads', displayMetrics.leads],
        ['Alcance', displayMetrics.reach.toLocaleString()],
        ['Impressões', displayMetrics.impressions.toLocaleString()],
        ['Valor Gasto', `R$ ${displayMetrics.spend.toFixed(2)}`],
        ['Custo por Lead', `R$ ${displayMetrics.costPerLead.toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [24, 119, 242] }
    });
    doc.save(`Relatorio_MetaAds.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Facebook className="text-blue-600" /> Inteligência Meta Ads
              {isConnected && <CheckCircle size={16} className="text-green-500" />}
            </h3>
            {isConnected && (
              <button onClick={handleDisconnect} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <LogOut size={16} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isConnected ? 'Conectado via Facebook Business' : 'Dados de demonstração (Não conectado)'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          {isConnected && (
            <div className="flex flex-wrap gap-2">
              <select value={selectedAccountId} onChange={handleAccountSelect} className="bg-white border rounded-lg px-3 py-2 text-xs font-bold">
                <option value="">Selecione a Conta...</option>
                {adAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <select value={selectedCampaignId} onChange={handleCampaignSelect} disabled={!selectedAccountId} className="bg-white border rounded-lg px-3 py-2 text-xs font-bold">
                <option value="">Todas as Campanhas</option>
                {campaigns.map(camp => <option key={camp.id} value={camp.id}>{camp.name}</option>)}
              </select>
              <select value={selectedAdSetId} onChange={handleAdSetSelect} disabled={!selectedCampaignId} className="bg-white border rounded-lg px-3 py-2 text-xs font-bold">
                <option value="">Todos os Grupos</option>
                {adSets.map(adSet => <option key={adSet.id} value={adSet.id}>{adSet.name}</option>)}
              </select>
              <select value={selectedAdId} onChange={handleAdSelect} disabled={!selectedAdSetId} className="bg-white border rounded-lg px-3 py-2 text-xs font-bold">
                <option value="">Todos os Anúncios</option>
                {ads.map(ad => <option key={ad.id} value={ad.id}>{ad.name}</option>)}
              </select>
              <select value={datePreset} onChange={handleDateChange} className="bg-blue-50 border-blue-200 border rounded-lg px-3 py-2 text-xs font-bold text-blue-700">
                <option value="last_30d">Últimos 30 dias</option>
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>
          )}
          <button onClick={isConnected ? handleRefresh : handleConnect} disabled={isSyncing} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
            {isConnected ? (isSyncing ? 'Sincronizando...' : 'Atualizar') : 'Conectar Facebook'}
          </button>
          {isConnected && isUsingRealData && (
            <button onClick={downloadPDFReport} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
              PDF
            </button>
          )}
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">{errorMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard title="Leads" value={displayMetrics.leads} change={realMetrics ? "Real" : "+12%"} icon={<Users className="text-blue-500" />} />
        <MetricCard title="Alcance" value={displayMetrics.reach.toLocaleString()} change={realMetrics ? "Real" : "+5%"} icon={<TrendingUp className="text-green-500" />} />
        <MetricCard title="Impressões" value={displayMetrics.impressions.toLocaleString()} change={realMetrics ? "Real" : "+8%"} icon={<Eye className="text-orange-500" />} />
        <MetricCard title="Valor Gasto" value={`R$ ${displayMetrics.spend.toFixed(2)}`} change={realMetrics ? "Total" : "-"} icon={<Target className="text-purple-500" />} />
        <MetricCard title="CPL" value={`R$ ${displayMetrics.costPerLead.toFixed(2)}`} change={realMetrics ? "CPL" : "-"} icon={<TrendingUp className="text-red-500" />} />
      </div>

      {isConnected && realMetrics && !realMetrics._noData && (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-3">Diagnóstico de Métricas</h5>
          <div className="flex flex-wrap gap-4">
            {realMetrics.actions?.map((a: any, idx: number) => (
              <div key={idx} className="text-xs text-blue-700 font-bold">{translateActionType(a.action_type)}: {a.value}</div>
            ))}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-white p-12 rounded-[2rem] border text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Facebook size={32} /></div>
          <h4 className="text-xl font-bold">Conectar Meta Ads</h4>
          <p className="text-gray-500 max-w-sm mx-auto">Sincronize seus dados do Gerenciador de Negócios oficial.</p>
          <button onClick={handleConnect} className="bg-[#1877F2] text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:scale-105 transition-all">
            Conectar com Facebook
          </button>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ title: string, value: string | number, change: string, icon: React.ReactNode }> = ({ title, value, change, icon }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg">{icon}</div>
      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${change === 'Real' || change === 'CPL' || change === 'Total' ? 'bg-blue-50 text-blue-600' : (change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500')}`}>{change}</span>
    </div>
    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-tight mb-1">{title}</p>
    <p className="text-xl md:text-2xl font-black text-slate-900 truncate">{value}</p>
  </div>
);

export default AdsView;
