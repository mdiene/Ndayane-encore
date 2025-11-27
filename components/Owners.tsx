import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Owner, Truck } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Briefcase, User, Phone, Mail, MapPin, Truck as TruckIcon, Edit, Trash2 } from 'lucide-react';

export const Owners: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  
  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentOwner, setCurrentOwner] = useState<Partial<Owner>>({});
  const [selectedOwnerDetails, setSelectedOwnerDetails] = useState<Owner | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [o, t] = await Promise.all([DataService.getOwners(), DataService.getTrucks()]);
    setOwners(o);
    setTrucks(t);
  };

  const getOwnerFleet = (ownerId: number) => trucks.filter(t => t.owner_id === ownerId);

  // --- CRUD Operations ---
  const handleOpenAdd = () => {
    setCurrentOwner({ owner_type: 'Individuel' });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (owner: Owner) => {
    setCurrentOwner(owner);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce propriétaire ?')) {
      try {
        await DataService.deleteOwner(id);
        loadData();
      } catch (e) {
        alert("Impossible de supprimer : vérifiez s'il a des camions assignés.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentOwner.owner_id) {
        await DataService.updateOwner(currentOwner.owner_id, currentOwner);
      } else {
        await DataService.addOwner(currentOwner as Omit<Owner, 'owner_id'>);
      }
      setIsFormModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const openDetails = (owner: Owner) => {
    setSelectedOwnerDetails(owner);
    setIsDetailsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Gestion des Propriétaires</h1>
        <Button onClick={handleOpenAdd}>+ Nouveau Propriétaire</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map(owner => (
          <div key={owner.owner_id} className="glass-panel p-6 rounded-xl hover:border-blue-500/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${owner.owner_type === 'Entreprise' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'}`}>
                  {owner.owner_type === 'Entreprise' ? <Briefcase size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">{owner.owner_name}</h3>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">{owner.owner_type}</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleOpenEdit(owner)} className="text-slate-400 hover:text-blue-400"><Edit size={16}/></button>
                 <button onClick={() => handleDelete(owner.owner_id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-slate-300 mb-6">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-500" />
                <span>{owner.phone_number || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-500" />
                <span className="truncate">{owner.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-500" />
                <span className="truncate">{owner.address || '-'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-slate-400">Flotte: <span className="text-white font-medium">{getOwnerFleet(owner.owner_id).length} camions</span></span>
              <Button variant="secondary" size="sm" onClick={() => openDetails(owner)}>Détails</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={currentOwner.owner_id ? "Modifier Propriétaire" : "Nouveau Propriétaire"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nom / Raison Sociale</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentOwner.owner_name || ''}
              onChange={e => setCurrentOwner({...currentOwner, owner_name: e.target.value})}
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentOwner.owner_type || 'Individuel'}
              onChange={e => setCurrentOwner({...currentOwner, owner_type: e.target.value as any})}
            >
              <option value="Individuel">Individuel</option>
              <option value="Entreprise">Entreprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentOwner.phone_number || ''}
                onChange={e => setCurrentOwner({...currentOwner, phone_number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentOwner.email || ''}
                onChange={e => setCurrentOwner({...currentOwner, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Adresse</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentOwner.address || ''}
              onChange={e => setCurrentOwner({...currentOwner, address: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Identifiant Fiscal (Tax ID)</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentOwner.tax_id || ''}
              onChange={e => setCurrentOwner({...currentOwner, tax_id: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title={selectedOwnerDetails?.owner_name || 'Détails Propriétaire'}
        size="lg"
      >
        {selectedOwnerDetails && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Capacité Totale</p>
                <p className="text-2xl font-bold text-white">
                  {(getOwnerFleet(selectedOwnerDetails.owner_id).reduce((acc, t) => acc + Number(t.capacity_kg), 0) / 1000).toFixed(1)} T
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Camions Actifs</p>
                <p className="text-2xl font-bold text-green-400">
                  {getOwnerFleet(selectedOwnerDetails.owner_id).filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TruckIcon size={18} /> Flotte de camions
              </h4>
              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Plaque</th>
                      <th className="px-4 py-2">Modèle</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Capacité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getOwnerFleet(selectedOwnerDetails.owner_id).map(truck => (
                      <tr key={truck.truck_id}>
                        <td className="px-4 py-2 font-mono text-blue-300">{truck.license_plate}</td>
                        <td className="px-4 py-2 text-slate-300">{truck.truck_model}</td>
                        <td className="px-4 py-2 text-slate-400">{truck.truck_type}</td>
                        <td className="px-4 py-2 text-slate-300">{truck.capacity_kg} kg</td>
                      </tr>
                    ))}
                    {getOwnerFleet(selectedOwnerDetails.owner_id).length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">Aucun camion assigné</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};