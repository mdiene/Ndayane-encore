import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Brush } from 'recharts';
import { Truck, Package, Scale, Activity, BarChart2, TrendingUp } from 'lucide-react';
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
  const [graphType, setGraphType] = useState<'bar' | 'area'>('bar');

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
  const totalWeight = deliveries.reduce((acc, curr) => acc + (curr.cargo_weight_kg || 0), 0) / 1000; // Tonnes
  const totalDeliveries = deliveries.length;
  const activeTrucks = trucks.filter(t => t.status === 'active' || t.status === 'en_transit').length;
  const efficiency = 94; // Mocked

  // Area Chart Data (Mocked)
  const weightData = [
    { name: 'Lun', weight: 4000 },
    { name: 'Mar', weight: 3000 },
    { name: 'Mer', weight: 5500 },
    { name: 'Jeu', weight: 4500 },
    { name: 'Ven', weight: 6000 },
    { name: 'Sam', weight: 2000 },
    { name: 'Dim', weight: 1000 },
  ];

  // Dynamic Bar Chart Data Logic
  const getVolumeData = () => {
    const dataMap = new Map<string, { count: number; weight: number; fullDate: string; label: string }>();
    
    // Determine range
    const daysCount = chartTimeFilter === '7days' ? 7 : 30;
    const endDate = new Date(); // Today
    
    // Helper to format local date to YYYY-MM-DD for map keys
    const getLocalISODate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Initialize all days in range with 0 values
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(endDate.getDate() - i);
        
        const isoKey = getLocalISODate(d);
        
        let label = '';
        if (chartTimeFilter === '7days') {
            // e.g. "Lun"
            label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        } else {
            // e.g. "15/03"
            label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }
        
        dataMap.set(isoKey, {
            label,
            count: 0,
            weight: 0,
            fullDate: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        });
    }

    let filtered = deliveries;
    if (chartOwnerFilter !== 'all') filtered = filtered.filter(d => d.owner_id === Number(chartOwnerFilter));

    filtered.forEach(d => {
        if (!d.pickup_date) return;
        const date = new Date(d.pickup_date);
        const isoKey = getLocalISODate(date);
        
        if (dataMap.has(isoKey)) {
            const entry = dataMap.get(isoKey)!;
            entry.count += 1;
            entry.weight += (d.cargo_weight_kg || 0);
        }
    });

    return Array.from(dataMap.values()).map(item => ({
        name: item.label,
        livraisons: item.count,
        poids: item.weight / 1000,
        fullDate: item.fullDate
    }));
  };

  const volumeData = getVolumeData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-base-300 p-3 rounded-lg shadow-xl text-sm border border-base-100 z-50">
          <p className="font-bold mb-2 pb-1 border-b border-base-content/10 capitalize">
            {data.fullDate || label}
          </p>
          <p className="text-primary mb-1 flex justify-between gap-4">
            <span>Livraisons:</span> <span className="font-bold">{payload[0].value}</span>
          </p>
          <p className="text-secondary flex justify-between gap-4">
            <span>Poids:</span> <span className="font-bold">{data.poids.toFixed(1)} T</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const ownerStats = owners.map(owner => {
    const ownerTruckIds = trucks.filter(t => t.owner_id === owner.owner_id).map(t => t.truck_id);
    const weight = deliveries
      .filter(d => ownerTruckIds.includes(d.truck_id))
      .reduce((acc, curr) => acc + (curr.cargo_weight_kg || 0), 0);
    return { ...owner, totalWeight: weight / 1000 };
  }).sort((a, b) => b.totalWeight - a.totalWeight);

  if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Poids Total (Tonnes)" value={totalWeight.toFixed(1)} icon={Scale} trend="+12%" color="primary" />
        <MetricCard title="Livraisons Totales" value={totalDeliveries} icon={Package} trend="+5%" color="secondary" />
        <MetricCard title="Camions Actifs" value={activeTrucks} icon={Truck} trend="Stable" color="accent" />
        <MetricCard title="Efficacité Flotte" value={`${efficiency}%`} icon={Activity} trend="+2%" color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl min-w-0">
          <div className="card-body p-6">
            <h3 className="card-title text-base mb-4">Poids transporté (7 derniers jours)</h3>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#66CC8A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#66CC8A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" strokeOpacity={0.5} />
                  <YAxis strokeOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: 'oklch(var(--b2))', borderColor: 'oklch(var(--b3))', borderRadius: '0.5rem' }} />
                  <Area type="monotone" dataKey="weight" stroke="#66CC8A" fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl min-w-0">
          <div className="card-body p-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
              <h3 className="card-title text-base">Volume Livraisons</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="join">
                    <button 
                        className={`join-item btn btn-xs ${graphType === 'bar' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                        onClick={() => setGraphType('bar')}
                        title="Graphique en barres"
                    >
                        <BarChart2 size={14} />
                    </button>
                    <button 
                        className={`join-item btn btn-xs ${graphType === 'area' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                        onClick={() => setGraphType('area')}
                        title="Graphique en aire"
                    >
                        <TrendingUp size={14} />
                    </button>
                </div>
                <div className="w-px h-4 bg-base-content/20 mx-1"></div>
                <div className="relative">
                  <select 
                    className="select select-bordered select-xs"
                    value={chartTimeFilter}
                    onChange={(e) => setChartTimeFilter(e.target.value as any)}
                  >
                    <option value="7days">7 jours</option>
                    <option value="30days">30 jours</option>
                  </select>
                </div>
                <select 
                  className="select select-bordered select-xs max-w-[120px]"
                  value={chartOwnerFilter}
                  onChange={(e) => setChartOwnerFilter(e.target.value)}
                >
                  <option value="all">Tous</option>
                  {owners.map(o => (
                    <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                {graphType === 'bar' ? (
                    <BarChart data={volumeData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        strokeOpacity={0.5} 
                        tick={{ fontSize: 11 }}
                        tickMargin={5}
                    />
                    <YAxis strokeOpacity={0.5} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'oklch(var(--b2))', opacity: 0.4 }} />
                    <Bar 
                        dataKey="livraisons" 
                        fill="#377CFB" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={50}
                        animationDuration={1500}
                    />
                    {chartTimeFilter === '30days' && (
                        <Brush 
                        dataKey="name" 
                        height={20} 
                        stroke="#377CFB" 
                        fill="oklch(var(--b2))"
                        travellerWidth={10}
                        tickFormatter={() => ''}
                        />
                    )}
                    </BarChart>
                ) : (
                    <AreaChart data={volumeData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#377CFB" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#377CFB" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            strokeOpacity={0.5} 
                            tick={{ fontSize: 11 }}
                            tickMargin={5}
                        />
                        <YAxis strokeOpacity={0.5} allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{stroke: 'oklch(var(--b3))', strokeWidth: 1 }} />
                        <Area 
                            type="monotone" 
                            dataKey="livraisons" 
                            stroke="#377CFB" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorVolume)"
                            animationDuration={1500}
                        />
                         {chartTimeFilter === '30days' && (
                            <Brush 
                            dataKey="name" 
                            height={20} 
                            stroke="#377CFB" 
                            fill="oklch(var(--b2))"
                            travellerWidth={10}
                            tickFormatter={() => ''}
                            />
                        )}
                    </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl lg:col-span-1">
          <div className="card-body p-0">
            <div className="p-4 border-b border-base-300">
              <h3 className="font-bold">Performance Propriétaires</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-4">
                {ownerStats.slice(0, 5).map((owner, idx) => (
                  <li key={owner.owner_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-warning text-warning-content' : 'bg-base-300'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{owner.owner_name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{owner.totalWeight.toFixed(1)} T</span>
                  </li>
                ))}
                {ownerStats.length === 0 && <p className="text-sm text-center py-2 opacity-50">Aucune donnée</p>}
              </ul>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body p-0">
             <div className="p-4 border-b border-base-300">
              <h3 className="font-bold">Livraisons Récentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200">
                    <th>ID</th>
                    <th>Client</th>
                    <th>Route</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.slice(0, 5).map(d => (
                    <tr key={d.delivery_id} className="hover:bg-base-200/50">
                      <td className="font-mono text-xs opacity-70">#{d.delivery_id}</td>
                      <td className="font-medium">{d.customer_name}</td>
                      <td className="text-xs opacity-70">{(d.pickup_location || '').split(' ')[0]} → {(d.delivery_location || '').split(' ')[0]}</td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(d.delivery_status)}>{d.delivery_status}</Badge>
                      </td>
                      <td className="text-xs opacity-70">
                        {new Date(d.pickup_date).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-4 opacity-50">Aucune livraison récente</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colorMap: any = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
    info: "text-info bg-info/10",
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-6 flex-row items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-60 uppercase tracking-wide">{title}</p>
          <h4 className="text-3xl font-extrabold mt-2">{value}</h4>
          <p className="text-xs text-success mt-2 font-medium flex items-center gap-1">
            {trend} <span className="opacity-60 font-normal text-base-content">vs mois dernier</span>
          </p>
        </div>
        <div className={`p-3 rounded-box ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};