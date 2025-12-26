import { useState } from 'react';
import { Plus, Edit, Trash2, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { mockServices, Service } from '../data/mockData';
import { toast } from 'sonner';

export function Services() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const categories = Array.from(new Set(mockServices.map(s => s.category)));

  const handleCreateNew = () => {
    setEditingService({
      id: `S${String(services.length + 1).padStart(3, '0')}`,
      category: 'General',
      name: '',
      duration: 30,
      active: true
    });
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService({ ...service });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingService) return;

    // Validation
    if (!editingService.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (editingService.duration <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    const exists = services.find(s => s.id === editingService.id);
    if (exists) {
      setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
      toast.success('Service updated successfully');
    } else {
      setServices(prev => [...prev, editingService]);
      toast.success('Service created successfully');
    }

    setDialogOpen(false);
    setEditingService(null);
  };

  const handleDelete = () => {
    if (!serviceToDelete) return;

    setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
    toast.success('Service deleted successfully');
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  const handleToggleActive = (service: Service) => {
    if (!service.active) {
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, active: true } : s));
      toast.success('Service activated');
    } else {
      // Show warning
      toast.warning('This service is linked to existing appointments', {
        description: 'Deactivating will prevent new bookings'
      });
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, active: false } : s));
    }
  };

  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage services and slot durations</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services by Category */}
      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryServices.map(service => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">ID: {service.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">{service.duration} minutes</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => handleToggleActive(service)}
                        />
                        <Badge 
                          variant="secondary" 
                          className={service.active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          }
                        >
                          {service.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setServiceToDelete(service);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No services found</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={handleCreateNew}
            >
              Create First Service
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService && services.find(s => s.id === editingService.id) 
                ? 'Edit Service' 
                : 'Create New Service'
              }
            </DialogTitle>
            <DialogDescription>
              {editingService && services.find(s => s.id === editingService.id)
                ? 'Update the service details below.'
                : 'Fill in the details to create a new service.'}
            </DialogDescription>
          </DialogHeader>

          {editingService && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingService.category}
                  onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="new">+ Add New Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g., Teeth Cleaning"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={editingService.duration}
                  onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={editingService.active}
                  onCheckedChange={(checked) => setEditingService({ ...editingService, active: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{serviceToDelete?.name}"? This action cannot be undone.
              {serviceToDelete && (
                <p className="mt-2 text-orange-600">
                  Warning: This service may be linked to existing appointments.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}