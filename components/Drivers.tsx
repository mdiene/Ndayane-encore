import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Driver, Truck } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { User, ShieldCheck, Truck as TruckIcon, Edit, Trash2 } from 'lucide-react';

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [d, t] = await Promise.all([DataService.getDrivers(), DataService.getTrucks()]);
    setDrivers(d);
    setTrucks(t);
  };

  const handleOpenAdd = () => {
    setCurrentDriver({ status: 'active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Voulez-vous supprimer ce chauffeur ?')) {
      try {
        await DataService.deleteDriver(id);
        loadData();
      } catch (e) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentDriver.driver_id) {
        await DataService.updateDriver(currentDriver.driver_id, currentDriver);
      } else {
        await DataService.addDriver(currentDriver as any);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue.");
    }
  };

  const DriverCard: React.FC<{ driver: Driver }> = ({ driver }) => (
    <div className="glass-panel p-4 rounded-lg flex flex-col gap-3 group">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
            <User className="text-slate-300" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{driver.first_name} {driver.last_name}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck size={12} /> {driver.license_number}
            </p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(driver.status)}>{driver.status}</Badge>
      </div>
      
      {driver.truck_id ? (
        <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2 flex items-center gap-2 text-sm text-blue-300">
          <TruckIcon size={14} />
          <span>Assigné à: <span className="font-mono font-bold">{driver.truck_plate}</span></span>
        </div>
      ) : (
        <div className="mt-2 bg-slate-500/10 border border-slate-500/20 rounded px-3 py-2 text-center text-sm text-slate-400">
          Non assigné
        </div>
      )}
  
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => handleOpenEdit(driver)}>
          <Edit size={14} className="mr-1" /> Modifier
        </Button>
        <Button variant="danger" size="sm" className="text-xs" onClick={() => handleDelete(driver.driver_id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );

  const activeAssignments = drivers.filter(d => d.truck_id);
  const unassignedPool = drivers.filter(d => !d.truck_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Active Assignments */}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-green-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Assignations Actives
          </h2>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">{activeAssignments.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {activeAssignments.map(d => <DriverCard key={d.driver_id} driver={d} />)}
          {activeAssignments.length === 0 && <p className="text-slate-500 text-center text-sm">Aucun chauffeur actif</p>}
        </div>
      </div>

      {/* Unassigned Pool */}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-600" />
            Pool de Chauffeurs
          </h2>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">{unassignedPool.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 bg-slate-900/20 rounded-xl border border-dashed border-slate-800 p-4 custom-scrollbar">
          {unassignedPool.map(d => <DriverCard key={d.driver_id} driver={d} />)}
          <Button 
            variant="ghost" 
            onClick={handleOpenAdd}
            className="w-full border-2 border-dashed border-slate-700 text-slate-500 py-4 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            + Ajouter un Chauffeur
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDriver.driver_id ? "Modifier Chauffeur" : "Ajouter Chauffeur"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Prénom</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.first_name || ''}
                onChange={e => setCurrentDriver({...currentDriver, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nom</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.last_name || ''}
                onChange={e => setCurrentDriver({...currentDriver, last_name: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Numéro Permis</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentDriver.license_number || ''}
              onChange={e => setCurrentDriver({...currentDriver, license_number: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.phone_number || ''}
                onChange={e => setCurrentDriver({...currentDriver, phone_number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.email || ''}
                onChange={e => setCurrentDriver({...currentDriver, email: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Statut</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.status || 'active'}
                onChange={e => setCurrentDriver({...currentDriver, status: e.target.value as any})}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="on_leave">En congé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Assigner Camion</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDriver.truck_id || ''}
                onChange={e => setCurrentDriver({...currentDriver, truck_id: e.target.value ? Number(e.target.value) : null})}
              >
                <option value="">Aucun</option>
                {trucks.map(t => (
                  <option key={t.truck_id} value={t.truck_id}>
                    {t.license_plate} {drivers.find(d => d.truck_id === t.truck_id && d.driver_id !== currentDriver.driver_id) ? '(Occupé)' : ''}
                  </option>
                ))}
              </select>
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