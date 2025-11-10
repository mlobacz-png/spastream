"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, Mail, MapPin, Phone, Users, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface BusinessInformationFormProps {
  onComplete: () => void;
}

export function BusinessInformationForm({ onComplete }: BusinessInformationFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: user?.email || "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    number_of_employees: "1",
    business_type: "",
    website: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit this form");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("business_information").insert({
        user_id: user.id,
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        number_of_employees: parseInt(formData.number_of_employees),
        business_type: formData.business_type,
        website: formData.website || null,
        onboarding_completed: true,
      });

      if (error) throw error;

      toast.success("Business information saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving business information:", error);
      toast.error(error.message || "Failed to save business information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            This information helps us understand your business and provide better support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              required
              placeholder="John Smith"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
            />
          </div>

          {/* Business Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="business_name"
                  required
                  placeholder="Serenity Med Spa"
                  className="pl-9"
                  value={formData.business_name}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Select
                required
                value={formData.business_type}
                onValueChange={(value) => handleChange("business_type", value)}
              >
                <SelectTrigger id="business_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medspa">Medical Spa</SelectItem>
                  <SelectItem value="dayspa">Day Spa</SelectItem>
                  <SelectItem value="salon">Salon & Spa</SelectItem>
                  <SelectItem value="wellness">Wellness Center</SelectItem>
                  <SelectItem value="dermatology">Dermatology Clinic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="info@serenitymedspa.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="(555) 123-4567"
                  className="pl-9"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="address_line1"
                  required
                  placeholder="123 Main Street"
                  className="pl-9"
                  value={formData.address_line1}
                  onChange={(e) => handleChange("address_line1", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                placeholder="Suite 200"
                value={formData.address_line2}
                onChange={(e) => handleChange("address_line2", e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  placeholder="Los Angeles"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  required
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  required
                  placeholder="90210"
                  value={formData.zip_code}
                  onChange={(e) => handleChange("zip_code", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                required
                value={formData.country}
                onValueChange={(value) => handleChange("country", value)}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number_of_employees">Number of Employees *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Select
                  required
                  value={formData.number_of_employees}
                  onValueChange={(value) => handleChange("number_of_employees", value)}
                >
                  <SelectTrigger id="number_of_employees" className="pl-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Just me)</SelectItem>
                    <SelectItem value="2">2-5</SelectItem>
                    <SelectItem value="6">6-10</SelectItem>
                    <SelectItem value="11">11-25</SelectItem>
                    <SelectItem value="26">26-50</SelectItem>
                    <SelectItem value="51">51+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://serenitymedspa.com"
                  className="pl-9"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
