import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Truck, Owner } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { LicensePlate } from './ui/LicensePlate';
import { Truck as TruckIcon, PenTool, Trash2 } from 'lucide-react';

export const Trucks: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTruck, setCurrentTruck] = useState<Partial<Truck>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [t, o] = await Promise.all([DataService.getTrucks(), DataService.getOwners()]);
    setTrucks(t);
    setOwners(o);
  };

  const groupedTrucks = trucks.reduce((acc, truck) => {
    const owner = truck.owner_name || 'Inconnu';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(truck);
    return acc;
  }, {} as Record<string, Truck[]>);

  const handleOpenAdd = () => { setCurrentTruck({ status: 'active', truck_type: 'Semi remorque', capacity_kg: 0 }); setIsModalOpen(true); };
  const handleOpenEdit = (truck: Truck) => { setCurrentTruck(truck); setIsModalOpen(true); };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce camion ?')) {
      try { await DataService.deleteTruck(id); loadData(); } catch (e: any) { alert(`Erreur: ${e.message || JSON.stringify(e)}`); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (currentTruck.truck_id) await DataService.updateTruck(currentTruck.truck_id, currentTruck);
        else await DataService.addTruck(currentTruck as any);
        setIsModalOpen(false);
        loadData();
    } catch (e: any) {
        alert(`Erreur: ${e.message || JSON.stringify(e)}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Parc de Camions</h1>
        <Button onClick={handleOpenAdd}>+ Ajouter un Camion</Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedTrucks).map(([ownerName, ownerTrucks]: [string, Truck[]]) => (
          <div key={ownerName} className="space-y-4">
            <h2 className="text-lg font-bold pl-2 border-l-4 border-primary flex justify-between items-center">
              <span>{ownerName}</span>
              <span className="badge badge-lg">{ownerTrucks.length} véhicules</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerTrucks.map(truck => (
                <div key={truck.truck_id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start mb-4">
                       {/* License Plate Display */}
                       <LicensePlate plateNumber={truck.license_plate} variant="sm" />
                       <Badge variant={getStatusBadgeVariant(truck.status)}>{truck.status}</Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-2 opacity-80">
                         <div className="p-2 bg-base-200 rounded-lg">
                           <TruckIcon size={20} />
                         </div>
                         <div>
                           <p className="font-bold text-sm">{truck.truck_model}</p>
                           <p className="text-xs opacity-60">Modèle</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 text-sm opacity-70 mb-2 mt-2 pt-2 border-t border-base-200/50">
                      <span>Type:</span> <span className="text-right font-medium">{truck.truck_type}</span>
                      <span>Capacité:</span> <span className="text-right font-medium">{(truck.capacity_kg / 1000).toFixed(1)} T</span>
                      <span>Année:</span> <span className="text-right font-medium">{truck.manufacture_year || '-'}</span>
                    </div>
                    <div className="card-actions justify-end mt-2 pt-2 border-t border-base-200">
                      <button className="btn btn-xs btn-ghost" onClick={() => handleOpenEdit(truck)}><PenTool size={14} /> Éditer</button>
                      <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDelete(truck.truck_id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTruck.truck_id ? "Modifier Camion" : "Nouveau Camion"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control"><label className="label">Propriétaire</label><select className="select select-bordered" value={currentTruck.owner_id || ''} onChange={e => setCurrentTruck({...currentTruck, owner_id: Number(e.target.value)})} required><option value="">Sélectionner</option>{owners.map(o => (<option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>))}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Plaque</label><input className="input input-bordered" value={currentTruck.license_plate || ''} onChange={e => setCurrentTruck({...currentTruck, license_plate: e.target.value})} required /></div>
            <div className="form-control"><label className="label">Modèle</label><input className="input input-bordered" value={currentTruck.truck_model || ''} onChange={e => setCurrentTruck({...currentTruck, truck_model: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Type</label><select className="select select-bordered" value={currentTruck.truck_type || 'Semi remorque'} onChange={e => setCurrentTruck({...currentTruck, truck_type: e.target.value as any})}><option value="Semi remorque">Semi remorque</option><option value="10 roues">10 roues</option><option value="12 roues">12 roues</option><option value="plateau">Plateau</option></select></div>
            <div className="form-control"><label className="label">Capacité (kg)</label><input type="number" className="input input-bordered" value={currentTruck.capacity_kg || 0} onChange={e => setCurrentTruck({...currentTruck, capacity_kg: Number(e.target.value)})} /></div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="form-control"><label className="label">Statut</label><select className="select select-bordered" value={currentTruck.status || 'active'} onChange={e => setCurrentTruck({...currentTruck, status: e.target.value as any})}><option value="active">Actif</option><option value="en_transit">En Transit</option><option value="maintenance">Maintenance</option><option value="demobilise">Démobilisé</option></select></div>
             <div className="form-control"><label className="label">Année</label><input type="number" className="input input-bordered" value={currentTruck.manufacture_year || ''} onChange={e => setCurrentTruck({...currentTruck, manufacture_year: Number(e.target.value)})} /></div>
           </div>
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
