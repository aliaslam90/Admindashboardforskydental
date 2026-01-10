import { useState } from 'react';
import { Mail, Phone, BookOpen, Briefcase, FileText, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Doctor } from '../../data/types';
import { toast } from 'sonner';

interface DoctorProfileProps {
  currentDoctor: Doctor;
}

export function DoctorProfile({ currentDoctor }: DoctorProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentDoctor.name,
    email: currentDoctor.email || '',
    phone: currentDoctor.phone || '',
    specialization: currentDoctor.specialization,
    education: currentDoctor.education || '',
    experience: currentDoctor.experience || '',
    bio: currentDoctor.bio || ''
  });

  const handleSave = () => {
    toast.success('Profile updated successfully', {
      description: 'Your information has been saved'
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentDoctor.name,
      email: currentDoctor.email || '',
      phone: currentDoctor.phone || '',
      specialization: currentDoctor.specialization,
      education: currentDoctor.education || '',
      experience: currentDoctor.experience || '',
      bio: currentDoctor.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your professional information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-medium text-blue-700">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              {!isEditing ? (
                <>
                  <CardTitle className="text-xl">{formData.name}</CardTitle>
                  <CardDescription className="mt-1">{formData.specialization}</CardDescription>
                  <Badge className="mt-2" variant={currentDoctor.status === 'active' ? 'default' : 'secondary'}>
                    {currentDoctor.status === 'active' ? '✓ Active' : 'Inactive'}
                  </Badge>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Enter your specialization"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{formData.email || 'Not provided'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm text-gray-500">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{formData.phone || 'Not provided'}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971-XX-XXX-XXXX"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-600" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              <div>
                <Label className="text-sm text-gray-500">Education</Label>
                <div className="flex items-start gap-2 mt-1">
                  <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{formData.education || 'Not provided'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm text-gray-500">Experience</Label>
                <div className="flex items-start gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{formData.experience || 'Not provided'}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="e.g., DDS, University of Dubai"
                />
              </div>
              <div>
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 10 years in General Dentistry"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Biography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Professional Biography
          </CardTitle>
          <CardDescription>
            A brief introduction about yourself and your expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formData.bio || 'No biography provided'}
            </p>
          ) : (
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell patients about yourself, your approach to dentistry, and your expertise..."
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-2">
                This will be visible to patients when they book appointments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Your regular working hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentDoctor.availability.map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{schedule.day}</span>
                <div className="flex gap-2">
                  {schedule.slots.map((slot, idx) => (
                    <Badge key={idx} variant="secondary">
                      {slot.start} - {slot.end}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            To modify your schedule, please contact the clinic administrator
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
