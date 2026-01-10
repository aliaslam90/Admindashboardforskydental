import { useState } from 'react';
import { Bell, Mail, MessageSquare, RefreshCw, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { mockNotifications, Notification } from '../data/types';
import { toast } from 'sonner';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const handleRetry = async (notif: Notification) => {
    toast.info('Retrying message delivery...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setNotifications(prev => 
      prev.map(n => 
        n.id === notif.id 
          ? { ...n, status: 'sent' as const, sentAt: new Date().toISOString() }
          : n
      )
    );
    
    toast.success('Message sent successfully');
  };

  const templates = [
    {
      type: 'OTP',
      description: 'One-time password for booking verification',
      template: 'Your Sky Dental OTP is: {code}. Valid for 5 minutes.'
    },
    {
      type: 'Booking Confirmation',
      description: 'Sent when appointment is confirmed',
      template: 'Dear {patient}, your appointment with {doctor} is confirmed for {date} at {time}.'
    },
    {
      type: 'Reschedule',
      description: 'Sent when appointment is rescheduled',
      template: 'Your appointment has been rescheduled to {date} at {time}. Contact us if you have questions.'
    },
    {
      type: 'Cancellation',
      description: 'Sent when appointment is cancelled',
      template: 'Your appointment on {date} at {time} has been cancelled. Please call us to reschedule.'
    },
    {
      type: 'Reminder',
      description: 'Sent 24 hours before appointment',
      template: 'Reminder: You have an appointment tomorrow at {time} with {doctor} at Sky Dental Clinic.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Manage patient communication and notification logs</p>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Notification Logs</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* Notification Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {notifications.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                <Check className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((notifications.filter(n => n.status === 'sent').length / notifications.length) * 100)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
                <X className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.status === 'failed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Appointment ID</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications
                      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
                      .map(notif => (
                        <TableRow key={notif.id}>
                          <TableCell className="font-mono text-sm">{notif.appointmentId}</TableCell>
                          <TableCell className="text-sm text-gray-900">{notif.recipient}</TableCell>
                          <TableCell>
                            {notif.channel === 'sms' ? (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">SMS</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Email</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {notif.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={notif.status === 'sent' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                              }
                            >
                              {notif.status === 'sent' ? 'Sent' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(notif.sentAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            {notif.status === 'failed' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRetry(notif)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {templates.map((template, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.type}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 font-mono">{template.template}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Supports: SMS, Email
                  </Badge>
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                    Variables: {template.template.match(/\{[^}]+\}/g)?.join(', ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Template Variables</p>
                  <p className="text-blue-800">
                    Use variables like {'{patient}'}, {'{doctor}'}, {'{date}'}, {'{time}'}, and {'{code}'} in your templates. 
                    They will be automatically replaced with actual appointment data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
