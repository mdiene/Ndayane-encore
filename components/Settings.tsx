import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Customer, Location } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Map, Users, Settings as SettingsIcon, Edit, Trash2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'routes'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Customer State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});

  // Location State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<Location>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, l] = await Promise.all([DataService.getCustomers(), DataService.getLocations()]);
    setCustomers(c);
    setLocations(l);
  };

  // --- Customer CRUD ---
  const handleOpenCustomerAdd = () => { setCurrentCustomer({}); setIsCustomerModalOpen(true); };
  const handleOpenCustomerEdit = (c: Customer) => { setCurrentCustomer(c); setIsCustomerModalOpen(true); };
  const handleDeleteCustomer = async (id: number) => {
    if (window.confirm('Supprimer ce client ?')) {
      await DataService.deleteCustomer(id);
      loadData();
    }
  };
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCustomer.customer_id) await DataService.updateCustomer(currentCustomer.customer_id, currentCustomer);
    else await DataService.addCustomer(currentCustomer as any);
    setIsCustomerModalOpen(false);
    loadData();
  };

  // --- Location CRUD ---
  const handleOpenLocationAdd = () => { setCurrentLocation({ distance_km: 0 }); setIsLocationModalOpen(true); };
  const handleOpenLocationEdit = (l: Location) => { setCurrentLocation(l); setIsLocationModalOpen(true); };
  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Supprimer cette destination ?')) {
      await DataService.deleteLocation(id);
      loadData();
    }
  };
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentLocation.location_id) await DataService.updateLocation(currentLocation.location_id, currentLocation);
    else await DataService.addLocation(currentLocation as any);
    setIsLocationModalOpen(false);
    loadData();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 glass-panel rounded-xl p-4 h-fit">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <SettingsIcon size={20} className="text-slate-400" /> Paramètres
        </h2>
        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Users size={18} />
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('routes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'routes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Map size={18} />
            Destinations
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-xl p-6 min-h-[500px]">
        {activeTab === 'customers' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Base Clients</h3>
              <Button size="sm" onClick={handleOpenCustomerAdd}>+ Ajouter</Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3">Nom</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Téléphone</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map(c => (
                    <tr key={c.customer_id} className="hover:bg-white/5 group">
                      <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                      <td className="px-6 py-4 text-slate-400">{c.email}</td>
                      <td className="px-6 py-4 text-slate-400">{c.phone}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenCustomerEdit(c)} className="text-slate-400 hover:text-blue-400"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteCustomer(c.customer_id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-500">Aucun client</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Routes Fréquentes</h3>
              <Button size="sm" onClick={handleOpenLocationAdd}>+ Nouvelle Route</Button>
            </div>
            <div className="grid gap-4">
              {locations.map(loc => (
                <div key={loc.location_id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg flex items-center justify-between group">
                  <div>
                    <h4 className="font-semibold text-white">{loc.name}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {loc.pickup_location} <span className="text-blue-500 mx-2">→</span> {loc.delivery_location}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-xl font-bold text-blue-400">{loc.distance_km} km</span>
                      <span className="text-xs text-slate-500">Distance</span>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4 border-l border-slate-700">
                      <button onClick={() => handleOpenLocationEdit(loc)} className="text-slate-400 hover:text-blue-400"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteLocation(loc.location_id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
              {locations.length === 0 && <p className="text-center py-8 text-slate-500">Aucune route enregistrée</p>}
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={currentCustomer.customer_id ? "Modifier Client" : "Nouveau Client"}>
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          <div><label className="text-xs text-slate-400">Nom</label><input required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentCustomer.name || ''} onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})} /></div>
          <div><label className="text-xs text-slate-400">Email</label><input type="email" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentCustomer.email || ''} onChange={e => setCurrentCustomer({...currentCustomer, email: e.target.value})} /></div>
          <div><label className="text-xs text-slate-400">Téléphone</label><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentCustomer.phone || ''} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})} /></div>
          <div><label className="text-xs text-slate-400">Adresse</label><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentCustomer.address || ''} onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Location Modal */}
      <Modal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} title={currentLocation.location_id ? "Modifier Route" : "Nouvelle Route"}>
        <form onSubmit={handleLocationSubmit} className="space-y-4">
          <div><label className="text-xs text-slate-400">Nom Route</label><input required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentLocation.name || ''} onChange={e => setCurrentLocation({...currentLocation, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400">Départ</label><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentLocation.pickup_location || ''} onChange={e => setCurrentLocation({...currentLocation, pickup_location: e.target.value})} /></div>
            <div><label className="text-xs text-slate-400">Arrivée</label><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentLocation.delivery_location || ''} onChange={e => setCurrentLocation({...currentLocation, delivery_location: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400">Distance (km)</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={currentLocation.distance_km || 0} onChange={e => setCurrentLocation({...currentLocation, distance_km: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-slate-400">Type</label><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="ex: Site, Usine..." value={currentLocation.location_type || ''} onChange={e => setCurrentLocation({...currentLocation, location_type: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsLocationModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};