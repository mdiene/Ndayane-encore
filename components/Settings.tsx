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

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<Location>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [c, l] = await Promise.all([DataService.getCustomers(), DataService.getLocations()]);
    setCustomers(c);
    setLocations(l);
  };

  const handleOpenCustomerAdd = () => { setCurrentCustomer({}); setIsCustomerModalOpen(true); };
  const handleOpenCustomerEdit = (c: Customer) => { setCurrentCustomer(c); setIsCustomerModalOpen(true); };
  const handleDeleteCustomer = async (id: number) => { if (window.confirm('Supprimer ?')) await DataService.deleteCustomer(id); loadData(); };
  const handleCustomerSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (currentCustomer.customer_id) await DataService.updateCustomer(currentCustomer.customer_id, currentCustomer); else await DataService.addCustomer(currentCustomer as any); setIsCustomerModalOpen(false); loadData(); };

  const handleOpenLocationAdd = () => { setCurrentLocation({ distance_km: 0 }); setIsLocationModalOpen(true); };
  const handleOpenLocationEdit = (l: Location) => { setCurrentLocation(l); setIsLocationModalOpen(true); };
  const handleDeleteLocation = async (id: number) => { if (window.confirm('Supprimer ?')) await DataService.deleteLocation(id); loadData(); };
  const handleLocationSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (currentLocation.location_id) await DataService.updateLocation(currentLocation.location_id, currentLocation); else await DataService.addLocation(currentLocation as any); setIsLocationModalOpen(false); loadData(); };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="w-full md:w-64 card bg-base-100 shadow-xl h-fit">
        <div className="card-body p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><SettingsIcon size={20} /> Paramètres</h2>
            <nav className="space-y-1">
            <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-primary text-primary-content font-bold' : 'hover:bg-base-200'}`}><Users size={18} /> Clients</button>
            <button onClick={() => setActiveTab('routes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'routes' ? 'bg-primary text-primary-content font-bold' : 'hover:bg-base-200'}`}><Map size={18} /> Destinations</button>
            </nav>
        </div>
      </div>

      <div className="flex-1 card bg-base-100 shadow-xl min-h-[500px]">
        <div className="card-body">
        {activeTab === 'customers' ? (
          <div>
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Base Clients</h3><Button size="sm" onClick={handleOpenCustomerAdd}>+ Ajouter</Button></div>
            <div className="overflow-x-auto rounded-box border border-base-200">
              <table className="table">
                <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.customer_id} className="hover">
                      <td className="font-bold">{c.name}</td><td>{c.email}</td><td>{c.phone}</td>
                      <td className="text-right"><button onClick={() => handleOpenCustomerEdit(c)} className="btn btn-ghost btn-xs"><Edit size={16}/></button><button onClick={() => handleDeleteCustomer(c.customer_id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={4} className="text-center">Aucun client</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Routes Fréquentes</h3><Button size="sm" onClick={handleOpenLocationAdd}>+ Nouvelle Route</Button></div>
            <div className="grid gap-4">
              {locations.map(loc => (
                <div key={loc.location_id} className="bg-base-200/50 border border-base-300 p-4 rounded-lg flex items-center justify-between hover:bg-base-200 transition-colors">
                  <div><h4 className="font-bold">{loc.name}</h4><p className="text-sm opacity-70 mt-1">{loc.pickup_location} <span className="text-primary mx-2">→</span> {loc.delivery_location}</p></div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><span className="block text-xl font-bold text-info">{loc.distance_km} km</span><span className="text-xs opacity-60">Distance</span></div>
                    <div className="flex gap-1 pl-4 border-l border-base-content/10"><button onClick={() => handleOpenLocationEdit(loc)} className="btn btn-ghost btn-xs"><Edit size={16}/></button><button onClick={() => handleDeleteLocation(loc.location_id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={16}/></button></div>
                  </div>
                </div>
              ))}
              {locations.length === 0 && <p className="text-center opacity-60">Aucune route</p>}
            </div>
          </div>
        )}
        </div>
      </div>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={currentCustomer.customer_id ? "Modifier Client" : "Nouveau Client"}>
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          <div className="form-control"><label className="label">Nom</label><input required className="input input-bordered" value={currentCustomer.name || ''} onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})} /></div>
          <div className="form-control"><label className="label">Email</label><input type="email" className="input input-bordered" value={currentCustomer.email || ''} onChange={e => setCurrentCustomer({...currentCustomer, email: e.target.value})} /></div>
          <div className="form-control"><label className="label">Tel</label><input className="input input-bordered" value={currentCustomer.phone || ''} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})} /></div>
          <div className="form-control"><label className="label">Adresse</label><input className="input input-bordered" value={currentCustomer.address || ''} onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})} /></div>
          <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>Annuler</Button><Button type="submit">Enregistrer</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} title={currentLocation.location_id ? "Modifier Route" : "Nouvelle Route"}>
        <form onSubmit={handleLocationSubmit} className="space-y-4">
          <div className="form-control"><label className="label">Nom Route</label><input required className="input input-bordered" value={currentLocation.name || ''} onChange={e => setCurrentLocation({...currentLocation, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Départ</label><input className="input input-bordered" value={currentLocation.pickup_location || ''} onChange={e => setCurrentLocation({...currentLocation, pickup_location: e.target.value})} /></div>
            <div className="form-control"><label className="label">Arrivée</label><input className="input input-bordered" value={currentLocation.delivery_location || ''} onChange={e => setCurrentLocation({...currentLocation, delivery_location: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Distance</label><input type="number" className="input input-bordered" value={currentLocation.distance_km || 0} onChange={e => setCurrentLocation({...currentLocation, distance_km: Number(e.target.value)})} /></div>
            <div className="form-control"><label className="label">Type</label><input className="input input-bordered" placeholder="ex: Site..." value={currentLocation.location_type || ''} onChange={e => setCurrentLocation({...currentLocation, location_type: e.target.value})} /></div>
          </div>
          <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsLocationModalOpen(false)}>Annuler</Button><Button type="submit">Enregistrer</Button></div>
        </form>
      </Modal>
    </div>
  );
};