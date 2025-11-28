import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Truck, Package, Scale, Activity, Filter } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Delivery, Truck as TruckType, Owner } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';

export const Dashboard: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [chartTimeFilter, setChartTimeFilter] = useState<'7days' | '30days'>('30days');
  const [chartOwnerFilter, setChartOwnerFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      const [d, t, o] = await Promise.all([
        DataService.getDeliveries(),
        DataService.getTrucks(),
        DataService.getOwners()
      ]);
      setDeliveries(d);
      setTrucks(t);
      setOwners(o);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Metrics
  const totalWeight = deliveries.reduce((acc, curr) => acc + curr.cargo_weight_kg, 0) / 1000; // Tonnes
  const totalDeliveries = deliveries.length;
  const activeTrucks = trucks.filter(t => t.status === 'active' || t.status === 'en_transit').length;
  const efficiency = 94; // Mocked calculation

  // Area Chart Data (Mocked for visual consistency as per original prompt, or could be dynamic too)
  const weightData = [
    { name: 'Lun', weight: 4000 },
    { name: 'Mar', weight: 3000 },
    { name: 'Mer', weight: 5500 },
    { name: 'Jeu', weight: 4500 },
    { name: 'Ven', weight: 6000 },
    { name: 'Sam', weight: 2000 },
    { name: 'Dim', weight: 1000 },
  ];

  // --- Dynamic Bar Chart Data Logic ---
  const getVolumeData = () => {
    const now = new Date();
    // Store both count and weight
    const dataMap = new Map<string, { count: number; weight: number }>();
    
    // 1. Filter Deliveries
    let filtered = deliveries;
    
    // Filter by Owner
    if (chartOwnerFilter !== 'all') {
      filtered = filtered.filter(d => d.owner_id === Number(chartOwnerFilter));
    }

    // Filter by Time & Grouping
    if (chartTimeFilter === '7days') {
      // Last 7 days: Group by Day
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6); // Include today
      cutoff.setHours(0, 0, 0, 0);

      // Initialize last 7 days with 0
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        dataMap.set(dayName, { count: 0, weight: 0 });
      }

      filtered.forEach(d => {
        const date = new Date(d.pickup_date);
        if (date >= cutoff) {
          const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
          const current = dataMap.get(dayName) || { count: 0, weight: 0 };
          dataMap.set(dayName, { 
            count: current.count + 1, 
            weight: current.weight + (d.cargo_weight_kg || 0)
          });
        }
      });

    } else {
      // Last 30 days: Group by Week
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);

      // Initialize 4 weeks
      for (let i = 1; i <= 4; i++) {
        dataMap.set(`Sem ${i}`, { count: 0, weight: 0 });
      }

      filtered.forEach(d => {
        const date = new Date(d.pickup_date);
        if (date >= cutoff) {
          // Simple week calculation relative to cutoff
          const diffTime = Math.abs(date.getTime() - cutoff.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          const weekNum = Math.min(Math.ceil(diffDays / 7), 4); // Cap at 4 weeks
          const key = `Sem ${weekNum}`;
          const current = dataMap.get(key) || { count: 0, weight: 0 };
          dataMap.set(key, { 
            count: current.count + 1, 
            weight: current.weight + (d.cargo_weight_kg || 0)
          });
        }
      });
    }

    // Convert Map to Array
    return Array.from(dataMap).map(([name, data]) => ({ 
      name, 
      livraisons: data.count,
      poids: data.weight / 1000 // Convert to Tonnes
    }));
  };

  const volumeData = getVolumeData();

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-sm">
          <p className="text-slate-300 font-medium mb-2 border-b border-slate-700 pb-1">{label}</p>
          <p className="text-violet-400 mb-1 flex justify-between gap-4">
            <span>Livraisons:</span> 
            <span className="font-bold text-white">{payload[0].value}</span>
          </p>
          <p className="text-blue-400 flex justify-between gap-4">
            <span>Poids Total:</span> 
            <span className="font-bold text-white">{payload[0].payload.poids.toFixed(1)} T</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Owner Rankings
  const ownerStats = owners.map(owner => {
    // Find trucks for this owner
    const ownerTruckIds = trucks.filter(t => t.owner_id === owner.owner_id).map(t => t.truck_id);
    // Sum weight of deliveries by these trucks
    const weight = deliveries
      .filter(d => ownerTruckIds.includes(d.truck_id))
      .reduce((acc, curr) => acc + curr.cargo_weight_kg, 0);
    return { ...owner, totalWeight: weight / 1000 };
  }).sort((a, b) => b.totalWeight - a.totalWeight);

  if (loading) return <div className="p-10 text-center text-slate-400">Chargement du tableau de bord...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Tableau de bord</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Poids Total (Tonnes)" 
          value={totalWeight.toFixed(1)} 
          icon={Scale} 
          trend="+12%" 
          color="blue" 
        />
        <MetricCard 
          title="Livraisons Totales" 
          value={totalDeliveries} 
          icon={Package} 
          trend="+5%" 
          color="violet" 
        />
        <MetricCard 
          title="Camions Actifs" 
          value={activeTrucks} 
          icon={Truck} 
          trend="Stable" 
          color="emerald" 
        />
        <MetricCard 
          title="Efficacité Flotte" 
          value={`${efficiency}%`} 
          icon={Activity} 
          trend="+2%" 
          color="amber" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Poids transporté (7 derniers jours)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart with Filters */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-white">Volume Livraisons</h3>
            
            <div className="flex items-center gap-2">
              {/* Time Filter */}
              <div className="relative">
                <select 
                  className="appearance-none bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500"
                  value={chartTimeFilter}
                  onChange={(e) => setChartTimeFilter(e.target.value as '7days' | '30days')}
                >
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
                </select>
                <Filter size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Owner Filter */}
              <select 
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 max-w-[150px]"
                value={chartOwnerFilter}
                onChange={(e) => setChartOwnerFilter(e.target.value)}
              >
                <option value="all">Tous Propriétaires</option>
                {owners.map(o => (
                  <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="livraisons" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner Performance */}
        <div className="glass-panel rounded-xl lg:col-span-1 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Performance Propriétaires</h3>
          </div>
          <div className="p-4 flex-1">
            <ul className="space-y-4">
              {ownerStats.slice(0, 5).map((owner, idx) => (
                <li key={owner.owner_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-200">{owner.owner_name}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">{owner.totalWeight.toFixed(1)} T</span>
                </li>
              ))}
              {ownerStats.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Aucune donnée</p>}
            </ul>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="glass-panel rounded-xl lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Livraisons Récentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 5).map(d => (
                  <tr key={d.delivery_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-slate-200">#{d.delivery_id}</td>
                    <td className="px-6 py-4">{d.customer_name}</td>
                    <td className="px-6 py-4 text-slate-400">{d.pickup_location.split(' ')[0]} → {d.delivery_location.split(' ')[0]}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(d.delivery_status)}>{d.delivery_status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(d.pickup_date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-slate-500">Aucune livraison récente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colorClasses: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="glass-panel p-6 rounded-xl flex items-start justify-between group hover:border-white/20 transition-all">
      <div>
        <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-white mt-2">{value}</h4>
        <p className="text-xs text-green-400 mt-2 font-medium flex items-center gap-1">
          {trend} <span className="text-slate-500 font-normal">vs mois dernier</span>
        </p>
      </div>
      <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};