import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Delivery, Truck, Driver, Customer, Location } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MapPin, Calendar, Truck as TruckIcon, User, Package, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [formData, setFormData] = useState<Partial<Delivery>>({ delivery_status: 'Planifie', pickup_date: new Date().toISOString().slice(0, 16) });
  const [statusUpdateData, setStatusUpdateData] = useState({ status: 'Planifie', actualDate: '', notes: '' });

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    const [d, t, dr, c, l] = await Promise.all([DataService.getDeliveries(), DataService.getTrucks(), DataService.getDrivers(), DataService.getCustomers(), DataService.getLocations()]);
    setDeliveries(d); setTrucks(t); setDrivers(dr); setCustomers(c); setLocations(l);
  };

  const groupedDeliveries = deliveries.reduce((acc, delivery) => {
    const owner = delivery.owner_name || 'Inconnu';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(delivery);
    return acc;
  }, {} as Record<string, Delivery[]>);

  const handleOpenAdd = () => { setFormData({ delivery_status: 'Planifie', pickup_date: new Date().toISOString().slice(0, 16), expected_delivery_date: new Date().toISOString().slice(0, 16), cargo_weight_kg: null, distance_km: null }); setIsFormModalOpen(true); };
  const handleOpenEdit = (delivery: Delivery) => { setFormData({ ...delivery, pickup_date: delivery.pickup_date ? new Date(delivery.pickup_date).toISOString().slice(0, 16) : '', expected_delivery_date: delivery.expected_delivery_date ? new Date(delivery.expected_delivery_date).toISOString().slice(0, 16) : '' }); setIsFormModalOpen(true); };
  const handleTruckChange = (truckId: string) => { const truck = trucks.find(t => t.truck_id === Number(truckId)); if (truck) { const driver = drivers.find(d => d.truck_id === truck.truck_id && d.status === 'active'); setFormData(prev => ({ ...prev, truck_id: truck.truck_id, driver_name: driver ? `${driver.first_name} ${driver.last_name}` : '', driver_license: driver ? driver.license_number : '', owner_id: truck.owner_id })); } };
  const handleLocationChange = (locationId: string) => { const location = locations.find(l => l.location_id === Number(locationId)); if (location) { setFormData(prev => ({ ...prev, delivery_location_id: location.location_id, pickup_location: location.pickup_location, delivery_location: location.delivery_location, distance_km: location.distance_km })); } else { setFormData(prev => ({ ...prev, delivery_location_id: null, pickup_location: '', delivery_location: '', distance_km: null })); } };
  
  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!formData.truck_id || !formData.customer_name) return; 
    try { 
      const payload: any = { 
        ...formData, 
        truck_id: Number(formData.truck_id), 
        cargo_weight_kg: formData.cargo_weight_kg, 
        distance_km: formData.distance_km
      }; 
      if (formData.delivery_id) await DataService.updateDelivery(formData.delivery_id, payload); 
      else await DataService.addDelivery(payload); 
      setIsFormModalOpen(false); 
      refreshData(); 
    } catch (e: any) { 
      console.error(e);
      alert(`Erreur: ${e.message || JSON.stringify(e)}`); 
    } 
  };
  
  const openStatusUpdate = (delivery: Delivery) => { setSelectedDelivery(delivery); setStatusUpdateData({ status: delivery.delivery_status, actualDate: delivery.actual_delivery_date ? new Date(delivery.actual_delivery_date).toISOString().slice(0, 16) : '', notes: delivery.notes || '' }); setIsStatusModalOpen(true); };
  const handleStatusUpdate = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!selectedDelivery) return; 
    try {
      await DataService.updateDelivery(selectedDelivery.delivery_id, { delivery_status: statusUpdateData.status as any, actual_delivery_date: statusUpdateData.actualDate || null, notes: statusUpdateData.notes }); 
      setIsStatusModalOpen(false); 
      refreshData();
    } catch (e: any) {
      alert(`Erreur: ${e.message || JSON.stringify(e)}`);
    }
  };
  const handleDelete = async (id: number) => { 
    if (window.confirm('Supprimer ?')) { 
      try {
        await DataService.deleteDelivery(id); 
        refreshData(); 
      } catch (e: any) {
        alert(`Erreur: ${e.message || JSON.stringify(e)}`);
      }
    } 
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Suivi des Livraisons</h1>
        <Button onClick={handleOpenAdd}><Plus size={18} className="mr-2" /> Nouvelle Livraison</Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedDeliveries).map(([ownerName, items]) => {
          const totalWeight = items.reduce((acc, i) => acc + (i.cargo_weight_kg || 0), 0) / 1000;
          return (
            <div key={ownerName} className="space-y-4">
              <div className="flex items-center gap-4 pl-4 border-l-4 border-primary bg-base-200 p-3 rounded-r-lg shadow-sm">
                <h2 className="text-lg font-bold">{ownerName}</h2>
                <div className="flex gap-4 text-sm opacity-70">
                  <span className="flex items-center gap-1"><Package size={14}/> {items.length} BL</span>
                  <span className="flex items-center gap-1"><TruckIcon size={14}/> {totalWeight.toFixed(1)} T</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(d => (
                  <div key={d.delivery_id} className="card bg-base-100 shadow-lg border-l-4 border-l-transparent hover:border-l-primary transition-all">
                    <div className="card-body p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="cursor-pointer" onClick={() => handleOpenEdit(d)}>
                          <span className="text-xs font-mono opacity-50 block hover:text-primary">#{d.delivery_id} (Modifier)</span>
                          <h3 className="font-bold">{d.customer_name}</h3>
                        </div>
                        <Badge variant={getStatusBadgeVariant(d.delivery_status)}>{d.delivery_status}</Badge>
                      </div>

                      <div className="bg-base-200/50 p-3 rounded-lg mb-3 flex items-center justify-between text-sm">
                        <div className="flex flex-col"><span className="text-[10px] opacity-60">Départ</span><span className="font-medium truncate max-w-[80px]" title={d.pickup_location}>{(d.pickup_location || '').split(' ')[0]}</span></div>
                        <div className="flex-1 flex flex-col items-center px-2"><span className="text-[10px] opacity-60">{d.distance_km ? `${d.distance_km} km` : '-'}</span><div className="w-full h-px bg-base-content/20 relative"><div className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-base-content/20 rotate-45" /></div></div>
                        <div className="flex flex-col text-right"><span className="text-[10px] opacity-60">Arrivée</span><span className="font-medium truncate max-w-[80px]" title={d.delivery_location}>{(d.delivery_location || '').split(' ')[0]}</span></div>
                      </div>

                      <div className="space-y-1 text-sm opacity-70 mb-3">
                        <div className="flex items-center gap-2"><Calendar size={14} /><span>{new Date(d.pickup_date).toLocaleDateString('fr-FR')}</span></div>
                        <div className="flex items-center gap-2"><Package size={14} /><span>{(d.cargo_weight_kg ? (d.cargo_weight_kg / 1000).toFixed(1) : '0')} T - {d.cargo_description || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><User size={14} /><span className="truncate">{d.driver_name}</span></div>
                      </div>

                      <div className="card-actions pt-2 border-t border-base-200 justify-between">
                         <Button variant="ghost" size="sm" onClick={() => openStatusUpdate(d)}><CheckCircle size={14} className="mr-1" /> Statut</Button>
                         <div className="flex gap-1">
                           <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEdit(d)}><Edit size={14} /></button>
                           <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(d.delivery_id)}><Trash2 size={14} /></button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={formData.delivery_id ? "Modifier" : "Nouvelle"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Camion</label><select className="select select-bordered" value={formData.truck_id || ''} onChange={(e) => handleTruckChange(e.target.value)} required><option value="">Sélectionner</option>{trucks.filter(t => t.status !== 'maintenance').map(t => (<option key={t.truck_id} value={t.truck_id}>{t.license_plate} - {t.truck_model}</option>))}</select></div>
            <div className="form-control"><label className="label">Client</label><select className="select select-bordered" value={formData.customer_name || ''} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required><option value="">Sélectionner</option>{customers.map(c => (<option key={c.customer_id} value={c.name}>{c.name}</option>))}</select></div>
          </div>
          <div className="form-control bg-base-200 p-3 rounded-lg"><label className="label font-bold text-xs opacity-60 uppercase">Chauffeur Auto</label><div className="flex gap-4"><input className="input input-sm w-full bg-base-100" value={formData.driver_name || ''} readOnly /><input className="input input-sm w-full bg-base-100" value={formData.driver_license || ''} readOnly /></div></div>
          <div className="form-control"><label className="label">Route</label><select className="select select-bordered" value={formData.delivery_location_id || ''} onChange={(e) => handleLocationChange(e.target.value)} required><option value="">Sélectionner une route...</option>{locations.map(loc => (<option key={loc.location_id} value={loc.location_id}>{loc.name} ({loc.pickup_location} ➝ {loc.delivery_location})</option>))}</select></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="form-control"><label className="label">Départ</label><input className="input input-bordered input-sm bg-base-200" value={formData.pickup_location || ''} readOnly /></div>
             <div className="form-control"><label className="label">Arrivée</label><input className="input input-bordered input-sm bg-base-200" value={formData.delivery_location || ''} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="form-control"><label className="label">Date Départ</label><input type="datetime-local" className="input input-bordered" value={formData.pickup_date} onChange={(e) => setFormData({...formData, pickup_date: e.target.value})} required /></div>
             <div className="form-control"><label className="label">Date Prévue</label><input type="datetime-local" className="input input-bordered" value={formData.expected_delivery_date} onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="form-control col-span-2"><label className="label">Description Fret</label><input className="input input-bordered" value={formData.cargo_description || ''} onChange={(e) => setFormData({...formData, cargo_description: e.target.value})} /></div>
             <div className="form-control"><label className="label">Poids (kg)</label><input type="number" className="input input-bordered" value={formData.cargo_weight_kg ?? ''} onChange={(e) => setFormData({...formData, cargo_weight_kg: e.target.value === '' ? null : Number(e.target.value)})} /></div>
          </div>
          <div className="modal-action">
             <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Annuler</Button>
             <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Mise à jour Statut">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="form-control"><label className="label">Nouveau Statut</label><select className="select select-bordered" value={statusUpdateData.status} onChange={(e) => setStatusUpdateData({...statusUpdateData, status: e.target.value})}><option value="Planifie">Planifié</option><option value="en_transit">En Transit</option><option value="decharge">Déchargé</option><option value="Retarde">Retardé</option><option value="annule">Annulé</option></select></div>
          <div className="form-control"><label className="label">Date réelle</label><input type="datetime-local" className="input input-bordered" value={statusUpdateData.actualDate} onChange={(e) => setStatusUpdateData({...statusUpdateData, actualDate: e.target.value})} /></div>
          <div className="form-control"><label className="label">Notes</label><textarea className="textarea textarea-bordered" value={statusUpdateData.notes} onChange={(e) => setStatusUpdateData({...statusUpdateData, notes: e.target.value})} /></div>
          <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsStatusModalOpen(false)}>Annuler</Button><Button type="submit">Enregistrer</Button></div>
        </form>
      </Modal>
    </div>
  );
};