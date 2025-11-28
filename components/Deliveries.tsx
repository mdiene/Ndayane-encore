
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Delivery, Truck, Driver, Customer, Location, DeliveryDetail } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MapPin, Calendar, Truck as TruckIcon, User, Package, Plus, Trash2, Edit, CheckCircle, Info, Coins, Calculator, TrendingUp } from 'lucide-react';

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Expenses (Financial Details) Modal
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [currentExpenses, setCurrentExpenses] = useState<Partial<DeliveryDetail>>({});
  const [dieselLiters, setDieselLiters] = useState<number | ''>(''); // Local state for calculator
  
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [viewDetailsExpenses, setViewDetailsExpenses] = useState<DeliveryDetail | null>(null); // For viewing in main details modal

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
  
  const handleLocationChange = (locationId: string) => { 
    const location = locations.find(l => l.location_id === Number(locationId)); 
    if (location) { 
      setFormData(prev => ({ 
        ...prev, 
        delivery_location_id: location.location_id, 
        pickup_location: location.address || '', 
        delivery_location: location.name, 
        distance_km: location.distance_km 
      })); 
    } else { 
      setFormData(prev => ({ ...prev, delivery_location_id: null, distance_km: null })); 
    } 
  };
  
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
  
  const openDetails = async (delivery: Delivery) => { 
    setSelectedDelivery(delivery); 
    setStatusUpdateData({ status: delivery.delivery_status, actualDate: delivery.actual_delivery_date ? new Date(delivery.actual_delivery_date).toISOString().slice(0, 16) : '', notes: delivery.notes || '' }); 
    
    // Fetch financial details for view
    setViewDetailsExpenses(null);
    if (delivery.has_details) {
      try {
        const details = await DataService.getDeliveryDetail(delivery.delivery_id);
        setViewDetailsExpenses(details);
      } catch (e) {
        console.error("Error loading details for view", e);
      }
    }
    
    setIsDetailsModalOpen(true); 
  };
  
  const handleStatusUpdate = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!selectedDelivery) return; 
    try {
      await DataService.updateDelivery(selectedDelivery.delivery_id, { delivery_status: statusUpdateData.status as any, actual_delivery_date: statusUpdateData.actualDate || null, notes: statusUpdateData.notes }); 
      setIsDetailsModalOpen(false); 
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

  // --- Expenses / Details Logic ---
  const handleOpenExpenses = async (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setCurrentExpenses({}); 
    setDieselLiters(''); // Reset liters
    
    try {
      const existingDetails = await DataService.getDeliveryDetail(delivery.delivery_id);
      if (existingDetails) {
        setCurrentExpenses(existingDetails);
        if (existingDetails.frais_gazoil) {
             setDieselLiters(Math.round(existingDetails.frais_gazoil / 755));
        }
      } else {
        setCurrentExpenses({ delivery_id: delivery.delivery_id });
      }
      setIsExpensesModalOpen(true);
    } catch (e: any) {
      alert(`Impossible de charger les détails: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleDieselLitersChange = (liters: string) => {
    const l = liters === '' ? '' : Number(liters);
    setDieselLiters(l);
    if (l !== '') {
        const cost = Math.round(l * 755);
        setCurrentExpenses(prev => ({ ...prev, frais_gazoil: cost }));
    }
  };

  const handleExpensesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      await DataService.saveDeliveryDetail({
        ...currentExpenses,
        delivery_id: selectedDelivery.delivery_id
      });
      setIsExpensesModalOpen(false);
      refreshData(); // To update the "has_details" icon
    } catch (e: any) {
      alert(`Erreur: ${e.message || JSON.stringify(e)}`);
    }
  };

  // Helper to calc total
  const calculateTotalExpenses = (details: DeliveryDetail | null) => {
      if (!details) return 0;
      return (details.frais_de_route || 0) + 
             (details.frais_gazoil || 0) + 
             (details.frais_de_payage || 0) + 
             (details.charge_journaliere || 0) + 
             (details.frais_divers || 0);
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
                         <Button variant="ghost" size="sm" onClick={() => openDetails(d)}><Info size={14} className="mr-1" /> Détails</Button>
                         <div className="flex gap-1">
                           <button 
                             className={`btn btn-xs ${d.has_details ? 'btn-secondary' : 'btn-outline btn-secondary'}`}
                             onClick={() => handleOpenExpenses(d)}
                             title={d.has_details ? "Modifier Frais" : "Ajouter Frais"}
                           >
                             {d.has_details ? (
                               <>
                                   <Coins size={14} />
                                   <span className="ml-1 font-mono font-bold">{(d.total_expenses || 0).toLocaleString()}</span>
                               </>
                             ) : (
                               <>
                                   <Plus size={14} />
                                   <span className="ml-1">Frais</span>
                               </>
                             )}
                           </button>

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

      {/* New/Edit Delivery Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={formData.delivery_id ? "Modifier" : "Nouvelle"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control"><label className="label">Camion</label><select className="select select-bordered" value={formData.truck_id || ''} onChange={(e) => handleTruckChange(e.target.value)} required><option value="">Sélectionner</option>{trucks.filter(t => t.status !== 'maintenance').map(t => (<option key={t.truck_id} value={t.truck_id}>{t.license_plate} - {t.truck_model}</option>))}</select></div>
            <div className="form-control"><label className="label">Client</label><select className="select select-bordered" value={formData.customer_name || ''} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required><option value="">Sélectionner</option>{customers.map(c => (<option key={c.customer_id} value={c.name}>{c.name}</option>))}</select></div>
          </div>
          <div className="form-control bg-base-200 p-3 rounded-lg"><label className="label font-bold text-xs opacity-60 uppercase">Chauffeur Auto</label><div className="flex gap-4"><input className="input input-sm w-full bg-base-100" value={formData.driver_name || ''} readOnly /><input className="input input-sm w-full bg-base-100" value={formData.driver_license || ''} readOnly /></div></div>
          
          <div className="form-control">
              <label className="label">Route (Sélectionner pour pré-remplir)</label>
              <select className="select select-bordered" value={formData.delivery_location_id || ''} onChange={(e) => handleLocationChange(e.target.value)} required>
                  <option value="">Sélectionner une route...</option>
                  {locations.map(loc => (
                      <option key={loc.location_id} value={loc.location_id}>
                          {loc.name} ({loc.distance_km} km)
                      </option>
                  ))}
              </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="form-control">
                 <label className="label">Départ</label>
                 <input 
                    className="input input-bordered input-sm" 
                    value={formData.pickup_location || ''} 
                    onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                 />
             </div>
             <div className="form-control">
                 <label className="label">Arrivée</label>
                 <input 
                    className="input input-bordered input-sm" 
                    value={formData.delivery_location || ''} 
                    onChange={e => setFormData({...formData, delivery_location: e.target.value})}
                 />
             </div>
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

      {/* Main Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Détails de la livraison" size="lg">
        {selectedDelivery && (
          <div className="space-y-6">
            <div className="bg-base-200 p-4 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedDelivery.customer_name}</h3>
                <span className="text-xs opacity-60 font-mono">#{selectedDelivery.delivery_id}</span>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedDelivery.delivery_status)}>{selectedDelivery.delivery_status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-4">
                  <h4 className="font-bold text-sm uppercase opacity-70 mb-2">Trajet</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                       <div>
                         <p className="font-bold">{selectedDelivery.pickup_location}</p>
                         <p className="text-xs opacity-60">{new Date(selectedDelivery.pickup_date).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="mt-1 w-2 h-2 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                       <div>
                         <p className="font-bold">{selectedDelivery.delivery_location}</p>
                         <p className="text-xs opacity-60">{new Date(selectedDelivery.expected_delivery_date).toLocaleString()} (Prévu)</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="card bg-base-100 shadow-sm border border-base-300">
                   <div className="card-body p-4 flex-row items-center gap-4">
                      <div className="p-3 bg-base-200 rounded-lg"><TruckIcon /></div>
                      <div>
                        <p className="text-sm opacity-60">Ressources</p>
                        <p className="font-bold">{trucks.find(t => t.truck_id === selectedDelivery.truck_id)?.license_plate}</p>
                        <p className="text-xs">{selectedDelivery.driver_name}</p>
                      </div>
                   </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-300">
                   <div className="card-body p-4 flex-row items-center gap-4">
                      <div className="p-3 bg-base-200 rounded-lg"><Package /></div>
                      <div>
                         <p className="text-sm opacity-60">Cargaison</p>
                         <p className="font-bold">{(selectedDelivery.cargo_weight_kg || 0) / 1000} T</p>
                         <p className="text-xs">{selectedDelivery.cargo_description}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Financial Details Section in View Mode */}
            {viewDetailsExpenses && (
                <div className="card bg-base-100 shadow-sm border border-base-300">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm uppercase opacity-70 mb-3 flex items-center gap-2">
                        <Coins size={16} /> Détails Financiers
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                        <div className="flex flex-col p-2 bg-base-200/30 rounded">
                            <span className="opacity-60 text-xs">Frais de Route</span>
                            <span className="font-bold">{viewDetailsExpenses.frais_de_route?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-base-200/30 rounded">
                            <span className="opacity-60 text-xs">Gazoil</span>
                            <span className="font-bold">{viewDetailsExpenses.frais_gazoil?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-base-200/30 rounded">
                            <span className="opacity-60 text-xs">Péage</span>
                            <span className="font-bold">{viewDetailsExpenses.frais_de_payage?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-base-200/30 rounded">
                            <span className="opacity-60 text-xs">Charge Journ.</span>
                            <span className="font-bold">{viewDetailsExpenses.charge_journaliere?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-base-200/30 rounded">
                            <span className="opacity-60 text-xs">Divers</span>
                            <span className="font-bold">{viewDetailsExpenses.frais_divers?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    <div className="divider my-1"></div>
                    <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg mt-2">
                        <span className="font-bold uppercase flex items-center gap-2"><TrendingUp size={16}/> Total Charges</span>
                        <span className="font-extrabold text-xl text-primary">
                            {calculateTotalExpenses(viewDetailsExpenses).toLocaleString()} FCFA
                        </span>
                    </div>
                  </div>
                </div>
            )}

            <div className="divider">Mise à jour Statut</div>
            <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">Nouveau Statut</label>
                <select className="select select-bordered" value={statusUpdateData.status} onChange={e => setStatusUpdateData({...statusUpdateData, status: e.target.value})}>
                  <option value="Planifie">Planifié</option>
                  <option value="en_transit">En Transit</option>
                  <option value="decharge">Déchargé</option>
                  <option value="Retarde">Retardé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">Date Réelle</label>
                <input type="datetime-local" className="input select-bordered" value={statusUpdateData.actualDate} onChange={e => setStatusUpdateData({...statusUpdateData, actualDate: e.target.value})} />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label">Notes</label>
                <textarea className="textarea textarea-bordered h-20" value={statusUpdateData.notes} onChange={e => setStatusUpdateData({...statusUpdateData, notes: e.target.value})} placeholder="Observations..." />
              </div>
              <div className="md:col-span-2 text-right">
                <Button type="submit">Enregistrer les modifications</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Expenses Management Modal */}
      <Modal isOpen={isExpensesModalOpen} onClose={() => setIsExpensesModalOpen(false)} title="Détails Financiers (Frais)" size="md">
        {selectedDelivery && (
          <div className="space-y-6">
             <div className="bg-base-200 p-4 rounded-xl text-sm">
                <div className="grid grid-cols-2 gap-2">
                   <div><span className="opacity-50">Trajet:</span> <span className="font-bold block">{selectedDelivery.pickup_location} → {selectedDelivery.delivery_location}</span></div>
                   <div><span className="opacity-50">Camion:</span> <span className="font-bold block">{trucks.find(t => t.truck_id === selectedDelivery.truck_id)?.license_plate}</span></div>
                </div>
             </div>

             <form onSubmit={handleExpensesSubmit} className="space-y-4">
                <div className="form-control">
                   <label className="label">Frais de Route</label>
                   <input type="number" className="input input-bordered" value={currentExpenses.frais_de_route || ''} onChange={e => setCurrentExpenses({...currentExpenses, frais_de_route: Number(e.target.value)})} />
                </div>
                
                <div className="form-control">
                   <label className="label flex justify-between">
                       <span>Gazoil (Coût)</span>
                       <span className="label-text-alt opacity-50 flex items-center gap-1"><Calculator size={12}/> Calculateur</span>
                   </label>
                   <div className="flex gap-2">
                      <div className="w-1/3 relative">
                         <input 
                           type="number" 
                           placeholder="Litres" 
                           className="input input-bordered w-full pr-8 input-primary"
                           value={dieselLiters}
                           onChange={e => handleDieselLitersChange(e.target.value)}
                         />
                         <span className="absolute right-2 top-3 text-xs opacity-50 font-bold">L</span>
                      </div>
                      <div className="w-2/3 relative">
                         <input 
                           type="number" 
                           className="input input-bordered w-full"
                           value={currentExpenses.frais_gazoil || ''} 
                           onChange={e => setCurrentExpenses({...currentExpenses, frais_gazoil: Number(e.target.value)})} 
                         />
                         <span className="absolute right-2 top-3 text-xs opacity-50">FCFA</span>
                      </div>
                   </div>
                   <label className="label"><span className="label-text-alt opacity-50">Calcul basé sur 755 FCFA/L</span></label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label">Péage</label>
                        <input type="number" className="input input-bordered" value={currentExpenses.frais_de_payage || ''} onChange={e => setCurrentExpenses({...currentExpenses, frais_de_payage: Number(e.target.value)})} />
                    </div>
                    <div className="form-control">
                        <label className="label">Charge journalière</label>
                        <input type="number" className="input input-bordered" value={currentExpenses.charge_journaliere || ''} onChange={e => setCurrentExpenses({...currentExpenses, charge_journaliere: Number(e.target.value)})} />
                    </div>
                </div>

                <div className="form-control">
                   <label className="label">Frais Divers</label>
                   <input type="number" className="input input-bordered" value={currentExpenses.frais_divers || ''} onChange={e => setCurrentExpenses({...currentExpenses, frais_divers: Number(e.target.value)})} />
                </div>

                <div className="form-control">
                   <label className="label">Notes / Justificatifs</label>
                   <textarea className="textarea textarea-bordered" value={currentExpenses.notes || ''} onChange={e => setCurrentExpenses({...currentExpenses, notes: e.target.value})}></textarea>
                </div>

                <div className="modal-action">
                   <Button type="button" variant="ghost" onClick={() => setIsExpensesModalOpen(false)}>Annuler</Button>
                   <Button type="submit" variant={currentExpenses.id_detail_livraison ? "secondary" : "primary"}>
                     {currentExpenses.id_detail_livraison ? "Mettre à jour" : "Enregistrer"}
                   </Button>
                </div>
             </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
