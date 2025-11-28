import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Owner, Truck } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Briefcase, User, Phone, Mail, MapPin, Truck as TruckIcon, Edit, Trash2 } from 'lucide-react';

export const Owners: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  
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
      } catch (e: any) {
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
    } catch (e: any) {
      console.error(e);
      alert(`Erreur: ${e.message || JSON.stringify(e)}`);
    }
  };

  const openDetails = (owner: Owner) => {
    setSelectedOwnerDetails(owner);
    setIsDetailsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Propriétaires</h1>
        <Button onClick={handleOpenAdd}>+ Nouveau Propriétaire</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map(owner => (
          <div key={owner.owner_id} className="card bg-base-100 shadow-xl group hover:shadow-2xl transition-all">
            <div className="card-body p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${owner.owner_type === 'Entreprise' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                    {owner.owner_type === 'Entreprise' ? <Briefcase size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{owner.owner_name}</h3>
                    <span className="badge badge-ghost badge-sm">{owner.owner_type}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleOpenEdit(owner)} className="btn btn-ghost btn-xs text-info"><Edit size={16}/></button>
                   <button onClick={() => handleDelete(owner.owner_id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm opacity-70 mb-4">
                <div className="flex items-center gap-3">
                  <Phone size={16} /> <span>{owner.phone_number || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} /> <span className="truncate">{owner.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} /> <span className="truncate">{owner.address || '-'}</span>
                </div>
              </div>

              <div className="card-actions justify-between items-center pt-2 border-t border-base-200">
                <span className="text-xs opacity-60">Flotte: <span className="font-bold text-base-content">{getOwnerFleet(owner.owner_id).length} camions</span></span>
                <Button variant="ghost" size="sm" onClick={() => openDetails(owner)}>Détails</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={currentOwner.owner_id ? "Modifier Propriétaire" : "Nouveau Propriétaire"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nom / Raison Sociale</span></label>
            <input type="text" className="input input-bordered w-full" value={currentOwner.owner_name || ''} onChange={e => setCurrentOwner({...currentOwner, owner_name: e.target.value})} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select className="select select-bordered w-full" value={currentOwner.owner_type || 'Individuel'} onChange={e => setCurrentOwner({...currentOwner, owner_type: e.target.value as any})}>
              <option value="Individuel">Individuel</option>
              <option value="Entreprise">Entreprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Téléphone</span></label>
              <input type="text" className="input input-bordered w-full" value={currentOwner.phone_number || ''} onChange={e => setCurrentOwner({...currentOwner, phone_number: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input type="email" className="input input-bordered w-full" value={currentOwner.email || ''} onChange={e => setCurrentOwner({...currentOwner, email: e.target.value})} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Adresse</span></label>
            <input type="text" className="input input-bordered w-full" value={currentOwner.address || ''} onChange={e => setCurrentOwner({...currentOwner, address: e.target.value})} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Identifiant Fiscal</span></label>
            <input type="text" className="input input-bordered w-full" value={currentOwner.tax_id || ''} onChange={e => setCurrentOwner({...currentOwner, tax_id: e.target.value})} />
          </div>
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={selectedOwnerDetails?.owner_name || 'Détails'} size="lg">
        {selectedOwnerDetails && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="stats shadow bg-base-200 w-full">
                <div className="stat">
                  <div className="stat-title">Capacité Totale</div>
                  <div className="stat-value text-primary">{(getOwnerFleet(selectedOwnerDetails.owner_id).reduce((acc, t) => acc + Number(t.capacity_kg), 0) / 1000).toFixed(1)} T</div>
                </div>
              </div>
              <div className="stats shadow bg-base-200 w-full">
                <div className="stat">
                  <div className="stat-title">Camions Actifs</div>
                  <div className="stat-value text-success">{getOwnerFleet(selectedOwnerDetails.owner_id).filter(t => t.status === 'active').length}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2"><TruckIcon size={18} /> Flotte</h4>
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr><th>Plaque</th><th>Modèle</th><th>Type</th><th>Capacité</th></tr>
                  </thead>
                  <tbody>
                    {getOwnerFleet(selectedOwnerDetails.owner_id).map(truck => (
                      <tr key={truck.truck_id}>
                        <td className="font-mono font-bold">{truck.license_plate}</td>
                        <td>{truck.truck_model}</td>
                        <td className="opacity-70">{truck.truck_type}</td>
                        <td>{truck.capacity_kg} kg</td>
                      </tr>
                    ))}
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