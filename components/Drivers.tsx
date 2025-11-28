
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Driver, Truck, Owner } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { User, ShieldCheck, Truck as TruckIcon, Edit, Trash2, Filter } from 'lucide-react';

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver>>({});
  
  // Filter State
  const [filterOwnerId, setFilterOwnerId] = useState<string>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [d, t, o] = await Promise.all([
      DataService.getDrivers(), 
      DataService.getTrucks(),
      DataService.getOwners()
    ]);
    setDrivers(d);
    setTrucks(t);
    setOwners(o);
  };

  const handleOpenAdd = () => { setCurrentDriver({ status: 'active' }); setIsModalOpen(true); };
  const handleOpenEdit = (driver: Driver) => { setCurrentDriver(driver); setIsModalOpen(true); };
  
  const handleDelete = async (id: number) => { 
    try {
        if (window.confirm('Supprimer ?')) await DataService.deleteDriver(id); 
        loadData(); 
    } catch(e: any) {
        alert(`Erreur: ${e.message || JSON.stringify(e)}`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      try {
        if (currentDriver.driver_id) await DataService.updateDriver(currentDriver.driver_id, currentDriver); 
        else await DataService.addDriver(currentDriver as any); 
        setIsModalOpen(false); 
        loadData(); 
      } catch (e: any) {
        alert(`Erreur: ${e.message || JSON.stringify(e)}`);
      }
  };

  const DriverCard: React.FC<{ driver: Driver }> = ({ driver }) => (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="text-xs"><User size={20} /></span>
              </div>
            </div>
            <div>
              <h4 className="font-bold">{driver.first_name} {driver.last_name}</h4>
              <p className="text-xs opacity-70 flex items-center gap-1"><ShieldCheck size={12} /> {driver.license_number}</p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(driver.status)}>{driver.status}</Badge>
        </div>
        {driver.truck_id ? (
          <div className="mt-2 bg-info/10 text-info px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
            <TruckIcon size={14} /> <span>Assigné à: <span className="font-mono font-bold">{driver.truck_plate}</span></span>
          </div>
        ) : (
          <div className="mt-2 bg-base-200 px-3 py-2 rounded-lg text-center text-sm opacity-60">Non assigné</div>
        )}
        <div className="card-actions justify-end mt-2">
          <button className="btn btn-xs btn-ghost" onClick={() => handleOpenEdit(driver)}><Edit size={14} /> Modifier</button>
          <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDelete(driver.driver_id)}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );

  // Split drivers
  const unassignedPool = drivers.filter(d => !d.truck_id);
  
  // Prepare Active Assignments with Owner Info
  const activeAssignments = drivers
    .filter(d => d.truck_id)
    .map(d => {
        const truck = trucks.find(t => t.truck_id === d.truck_id);
        return {
            ...d,
            owner_name: truck?.owner_name || 'Inconnu',
            owner_id: truck?.owner_id
        };
    });

  // Filter
  const filteredActiveDrivers = filterOwnerId === 'all'
    ? activeAssignments
    : activeAssignments.filter(d => d.owner_id === Number(filterOwnerId));

  // Group by Owner
  const groupedDrivers = filteredActiveDrivers.reduce((acc, driver) => {
    const ownerName = driver.owner_name;
    if (!acc[ownerName]) acc[ownerName] = [];
    acc[ownerName].push(driver);
    return acc;
  }, {} as Record<string, typeof activeAssignments>);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Active Assignments Grouped by Owner */}
      <div className="flex flex-col h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
             <h2 className="text-lg font-bold text-success">Affectations Actives</h2>
             <span className="badge badge-lg">{activeAssignments.length}</span>
          </div>

          <div className="relative w-full sm:w-auto">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
             <select 
                className="select select-bordered select-sm w-full pl-10"
                value={filterOwnerId}
                onChange={(e) => setFilterOwnerId(e.target.value)}
             >
                <option value="all">Tous les propriétaires</option>
                {owners.map(o => (
                  <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>
                ))}
             </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-10">
            {Object.entries(groupedDrivers).length === 0 && (
                <div className="text-center py-10 opacity-50 bg-base-200 rounded-lg">
                    Aucun chauffeur actif trouvé pour ce filtre.
                </div>
            )}

            {Object.entries(groupedDrivers).map(([ownerName, ownerDrivers]) => (
                <div key={ownerName} className="mb-6">
                    <div className="flex items-center gap-2 mb-3 pl-2 border-l-4 border-primary">
                        <h3 className="font-bold">{ownerName}</h3>
                        <span className="badge badge-sm badge-ghost">{ownerDrivers.length}</span>
                    </div>
                    <div className="space-y-3 pl-2">
                        {ownerDrivers.map(d => <DriverCard key={d.driver_id} driver={d} />)}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Right Column: Unassigned Pool */}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold opacity-70 flex items-center gap-2">Chauffeurs Disponibles</h2>
          <span className="badge badge-lg">{unassignedPool.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 bg-base-200/50 p-4 rounded-xl border border-dashed border-base-300 pb-10">
          {unassignedPool.map(d => <DriverCard key={d.driver_id} driver={d} />)}
          <Button variant="ghost" className="w-full border-2 border-dashed border-base-300 py-4 opacity-70 hover:opacity-100" onClick={handleOpenAdd}>+ Ajouter un Chauffeur</Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDriver.driver_id ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Prénom</label><input className="input input-bordered" value={currentDriver.first_name || ''} onChange={e => setCurrentDriver({...currentDriver, first_name: e.target.value})} required /></div>
            <div className="form-control"><label className="label">Nom</label><input className="input input-bordered" value={currentDriver.last_name || ''} onChange={e => setCurrentDriver({...currentDriver, last_name: e.target.value})} required /></div>
          </div>
          <div className="form-control"><label className="label">Permis</label><input className="input input-bordered" value={currentDriver.license_number || ''} onChange={e => setCurrentDriver({...currentDriver, license_number: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="form-control"><label className="label">Tel</label><input className="input input-bordered" value={currentDriver.phone_number || ''} onChange={e => setCurrentDriver({...currentDriver, phone_number: e.target.value})} /></div>
             <div className="form-control"><label className="label">Email</label><input className="input input-bordered" value={currentDriver.email || ''} onChange={e => setCurrentDriver({...currentDriver, email: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Statut</label><select className="select select-bordered" value={currentDriver.status || 'active'} onChange={e => setCurrentDriver({...currentDriver, status: e.target.value as any})}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="on_leave">En congé</option></select></div>
            <div className="form-control"><label className="label">Camion</label><select className="select select-bordered" value={currentDriver.truck_id || ''} onChange={e => setCurrentDriver({...currentDriver, truck_id: e.target.value ? Number(e.target.value) : null})}><option value="">Aucun</option>{trucks.map(t => (<option key={t.truck_id} value={t.truck_id}>{t.license_plate}</option>))}</select></div>
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
