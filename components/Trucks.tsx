import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Truck, Owner } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Truck as TruckIcon, PenTool, Trash2 } from 'lucide-react';

export const Trucks: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTruck, setCurrentTruck] = useState<Partial<Truck>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, o] = await Promise.all([DataService.getTrucks(), DataService.getOwners()]);
    setTrucks(t);
    setOwners(o);
  };

  // Group trucks by owner_name
  const groupedTrucks = trucks.reduce((acc, truck) => {
    const owner = truck.owner_name || 'Inconnu';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(truck);
    return acc;
  }, {} as Record<string, Truck[]>);

  // --- CRUD Operations ---
  const handleOpenAdd = () => {
    setCurrentTruck({ status: 'active', truck_type: 'Semi remorque', capacity_kg: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (truck: Truck) => {
    setCurrentTruck(truck);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce camion ?')) {
      try {
        await DataService.deleteTruck(id);
        loadData();
      } catch (e) {
        alert("Erreur lors de la suppression. Vérifiez si des livraisons sont liées.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTruck.truck_id) {
        await DataService.updateTruck(currentTruck.truck_id, currentTruck);
      } else {
        await DataService.addTruck(currentTruck as any);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Parc de Camions</h1>
        <Button onClick={handleOpenAdd}>+ Ajouter un Camion</Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedTrucks).map(([ownerName, ownerTrucks]: [string, Truck[]]) => (
          <div key={ownerName} className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-400 pl-2 border-l-4 border-blue-500">
              {ownerName} <span className="text-slate-500 text-sm ml-2">({ownerTrucks.length} véhicules)</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerTrucks.map(truck => (
                <div key={truck.truck_id} className="glass-panel p-5 rounded-xl group hover:bg-slate-800/80 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                        <TruckIcon className="text-slate-300" size={24} />
                      </div>
                      <div>
                        <h3 className="font-mono font-bold text-lg text-white">{truck.license_plate}</h3>
                        <p className="text-xs text-slate-400">{truck.truck_model}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(truck.status)}>{truck.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-400 mb-4">
                    <span>Type:</span> <span className="text-slate-200 text-right">{truck.truck_type}</span>
                    <span>Capacité:</span> <span className="text-slate-200 text-right">{(truck.capacity_kg / 1000).toFixed(1)} T</span>
                    <span>Année:</span> <span className="text-slate-200 text-right">{truck.manufacture_year || '-'}</span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleOpenEdit(truck)}>
                      <PenTool size={14} className="mr-2" /> Éditer
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(truck.truck_id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {trucks.length === 0 && <p className="text-slate-500 text-center py-10">Aucun camion enregistré.</p>}
      </div>

      {/* Truck Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTruck.truck_id ? "Modifier Camion" : "Nouveau Camion"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Propriétaire</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentTruck.owner_id || ''}
              onChange={e => setCurrentTruck({...currentTruck, owner_id: Number(e.target.value)})}
              required
            >
              <option value="">Sélectionner un propriétaire</option>
              {owners.map(o => (
                <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Plaque Immatriculation</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                value={currentTruck.license_plate || ''}
                onChange={e => setCurrentTruck({...currentTruck, license_plate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Modèle</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentTruck.truck_model || ''}
                onChange={e => setCurrentTruck({...currentTruck, truck_model: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentTruck.truck_type || 'Semi remorque'}
                onChange={e => setCurrentTruck({...currentTruck, truck_type: e.target.value as any})}
              >
                <option value="Semi remorque">Semi remorque</option>
                <option value="10 roues">10 roues</option>
                <option value="12 roues">12 roues</option>
                <option value="plateau">Plateau</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Capacité (kg)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentTruck.capacity_kg || 0}
                onChange={e => setCurrentTruck({...currentTruck, capacity_kg: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Statut</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentTruck.status || 'active'}
                onChange={e => setCurrentTruck({...currentTruck, status: e.target.value as any})}
              >
                <option value="active">Actif</option>
                <option value="en_transit">En Transit</option>
                <option value="maintenance">Maintenance</option>
                <option value="demobilise">Démobilisé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Année Fabrication</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentTruck.manufacture_year || ''}
                onChange={e => setCurrentTruck({...currentTruck, manufacture_year: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};