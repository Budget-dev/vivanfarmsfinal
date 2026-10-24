"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Home, 
  Briefcase, 
  Check, 
  Loader2,
  Phone,
  User,
  Building,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  tag?: 'Home' | 'Work' | 'Other';
}

interface AddressManagerProps {
  address: ShippingAddress;
  onChange: (updated: ShippingAddress) => void;
  errors?: Record<string, string>;
  className?: string;
}

const SAVED_ADDRESSES_KEY = 'vivaan_saved_addresses';

export const AddressManager: React.FC<AddressManagerProps> = ({
  address,
  onChange,
  errors = {},
  className = '',
}) => {
  const { toast } = useToast();
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedTag, setSelectedTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Geolocation states
  const [geoState, setGeoState] = useState<'idle' | 'detecting' | 'success' | 'denied' | 'error'>('idle');
  const [geoMessage, setGeoMessage] = useState<string>('');

  // Pincode lookup states
  const [pincodeLookupState, setPincodeLookupState] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [pincodeNotice, setPincodeNotice] = useState<string>('');

  // Load saved addresses from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADDRESSES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAddresses(parsed);
        }
      }
    } catch {
      // Ignore JSON error
    }
  }, []);

  // Save current address to saved addresses list
  const handleSaveCurrentAddress = () => {
    if (!address.name || !address.phone || !address.address || !address.pincode) {
      toast({
        variant: "destructive",
        title: "Incomplete Address",
        description: "Please fill in all required fields before saving.",
      });
      return;
    }

    const newEntry: ShippingAddress = {
      ...address,
      tag: selectedTag,
    };

    const updated = [
      newEntry,
      ...savedAddresses.filter(a => a.address !== address.address || a.pincode !== address.pincode)
    ].slice(0, 4); // Keep top 4 addresses

    setSavedAddresses(updated);
    try {
      localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(updated));
      toast({
        title: "Address Saved",
        description: `Saved to your ${selectedTag} addresses.`,
      });
    } catch {
      // Ignore storage error
    }
  };

  const handleSelectSavedAddress = (saved: ShippingAddress) => {
    onChange(saved);
    if (saved.tag) setSelectedTag(saved.tag);
    toast({
      title: "Address Selected",
      description: `Loaded ${saved.tag || 'saved'} shipping address.`,
    });
  };

  // Indian Pincode Auto-Lookup via Postal API
  const handlePincodeLookup = useCallback(async (code: string) => {
    const cleanPincode = code.trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setPincodeLookupState('idle');
      setPincodeNotice('');
      return;
    }

    setPincodeLookupState('checking');
    setPincodeNotice('Verifying pincode...');

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
        cache: 'force-cache'
      });
      const data = await res.json();

      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const detectedCity = postOffice.District || postOffice.Block || postOffice.Name;
        const detectedState = postOffice.State;

        onChange({
          ...address,
          pincode: cleanPincode,
          city: address.city || detectedCity,
          state: address.state || detectedState,
        });

        setPincodeLookupState('verified');
        setPincodeNotice(`${detectedCity}, ${detectedState}`);
      } else {
        setPincodeLookupState('failed');
        setPincodeNotice('Pincode verified locally. Please confirm City and State.');
      }
    } catch {
      setPincodeLookupState('failed');
      setPincodeNotice('Pincode lookup offline. Please enter City & State manually.');
    }
  }, [address, onChange]);

  // Helper to reverse geocode coordinates using BigDataCloud with Nominatim fallback
  const reverseGeocodeCoords = async (latitude: number, longitude: number) => {
    let road = '';
    let city = '';
    let state = '';
    let pincode = '';
    let locality = '';
    let houseNumber = '';

    // 1. Primary: BigDataCloud Reverse Geocode (CORS-friendly, ultra-fast for browsers)
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        city = bdc.city || bdc.locality || '';
        state = bdc.principalSubdivision || '';
        locality = bdc.locality || '';
        pincode = (bdc.postcode || '').replace(/\D/g, '').slice(0, 6);
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocode error:', e);
    }

    // 2. Secondary: OpenStreetMap Nominatim (to enrich street, house number, or missing pincode)
    if (!city || !pincode || !road) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { credentials: 'omit' }
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const addr = nomData.address || {};
          road = addr.road || addr.street || addr.suburb || addr.neighbourhood || road;
          city = city || addr.city || addr.town || addr.village || addr.county || addr.district || '';
          state = state || addr.state || '';
          pincode = pincode || (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
          houseNumber = addr.house_number || '';
        }
      } catch (e) {
        console.warn('Nominatim reverse geocode error:', e);
      }
    }

    const fullStreet = [houseNumber, road, locality].filter(Boolean).join(', ');
    return { street: fullStreet, city, state, pincode };
  };

  // Helper for IP-based location fallback (Works on PCs/laptops without GPS or when permission is denied)
  const detectLocationByIP = async () => {
    try {
      // Provider 1: ipwho.is (fast, free, accurate city/state/pincode for India)
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          return {
            city: data.city || '',
            state: data.region || '',
            pincode: (data.postal || '').replace(/\D/g, '').slice(0, 6)
          };
        }
      }
    } catch (e) {
      console.warn('ipwho.is error:', e);
    }

    try {
      // Provider 2: freeipapi.com
      const res2 = await fetch('https://freeipapi.com/api/json');
      if (res2.ok) {
        const data2 = await res2.json();
        return {
          city: data2.cityName || '',
          state: data2.regionName || '',
          pincode: (data2.zipCode || '').replace(/\D/g, '').slice(0, 6)
        };
      }
    } catch (e) {
      console.warn('freeipapi error:', e);
    }

    return null;
  };

  // GPS & IP Geolocation Detection with robust fallbacks
  const handleUseCurrentLocation = useCallback(async (isSilent: boolean | unknown = false) => {
    const silent = isSilent === true;
    if (!silent) {
      setGeoState('detecting');
      setGeoMessage('Detecting your location...');
    }

    const applyIPFallback = async (fallbackMsg?: string) => {
      const ipResult = await detectLocationByIP();
      if (ipResult && (ipResult.city || ipResult.state || ipResult.pincode)) {
        onChange({
          ...address,
          city: ipResult.city || address.city,
          state: ipResult.state || address.state,
          pincode: ipResult.pincode || address.pincode,
        });
        setGeoState('success');
        setGeoMessage(`Location detected: ${[ipResult.city, ipResult.state].filter(Boolean).join(', ')}. Please check flat/street details.`);
        if (ipResult.pincode && ipResult.pincode.length === 6) {
          handlePincodeLookup(ipResult.pincode);
        }
        return true;
      }
      if (!silent) {
        setGeoState('error');
        setGeoMessage(fallbackMsg || 'Unable to detect location. Please enter your address manually.');
      }
      return false;
    };

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      await applyIPFallback('Location service not supported. Located via network.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocodeCoords(latitude, longitude);

          if (geo.city || geo.state || geo.pincode || geo.street) {
            onChange({
              ...address,
              address: geo.street || address.address,
              city: geo.city || address.city,
              state: geo.state || address.state,
              pincode: geo.pincode || address.pincode,
            });

            setGeoState('success');
            setGeoMessage(`Location detected: ${[geo.city, geo.state].filter(Boolean).join(', ')}. Please check flat/building number.`);

            if (geo.pincode && geo.pincode.length === 6) {
              handlePincodeLookup(geo.pincode);
            }
          } else {
            await applyIPFallback();
          }
        } catch (err) {
          console.warn('Geocoding error:', err);
          await applyIPFallback();
        }
      },
      async (geoError) => {
        console.warn('GPS detection notice:', geoError.message);
        // Seamlessly fallback to IP location if GPS is denied, timed out, or unavailable
        await applyIPFallback(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'GPS permission denied. Located via network — please verify flat/street.'
            : 'GPS timed out. Located via network — please verify flat/street.'
        );
      },
      { timeout: 7000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }, [address, handlePincodeLookup, onChange]);

  // Automatic location detection on mount if address fields are blank
  useEffect(() => {
    if (!address.city && !address.pincode && !address.address) {
      const isAlreadyRun = typeof window !== 'undefined' && sessionStorage.getItem('vivaan_geo_autodetected');
      if (!isAlreadyRun) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vivaan_geo_autodetected', '1');
        }
        // Run silent IP-based auto detection
        detectLocationByIP().then((ip) => {
          if (ip && (ip.city || ip.state || ip.pincode)) {
            onChange({
              ...address,
              city: ip.city || address.city,
              state: ip.state || address.state,
              pincode: ip.pincode || address.pincode,
            });
            setGeoState('success');
            setGeoMessage(`Auto-detected: ${[ip.city, ip.state].filter(Boolean).join(', ')}. Please add house/flat number.`);
            if (ip.pincode && ip.pincode.length === 6) {
              handlePincodeLookup(ip.pincode);
            }
          }
        });
      }
    }
  }, [address, handlePincodeLookup, onChange]);

  const handleFieldChange = (name: keyof ShippingAddress, value: string) => {
    let formattedValue = value;
    if (name === 'phone') {
      // Only keep digits and limit to 10
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (name === 'pincode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
      if (formattedValue.length === 6) {
        handlePincodeLookup(formattedValue);
      } else {
        setPincodeLookupState('idle');
        setPincodeNotice('');
      }
    }

    onChange({
      ...address,
      [name]: formattedValue,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Quick Location Detection & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF7EF] p-4 rounded-2xl border border-[#EEE0BC]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5B4E38]">
          <Navigation className="w-4 h-4 text-primary shrink-0" />
          <span>Need faster checkout?</span>
        </div>

        <button
          type="button"
          onClick={() => handleUseCurrentLocation(false)}
          disabled={geoState === 'detecting'}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#1B5E3B]/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          {geoState === 'detecting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation Feedback Alert */}
      {geoState !== 'idle' && (
        <div className={cn(
          "p-3 rounded-xl text-xs flex items-start gap-2.5 transition-all",
          geoState === 'success' && "bg-emerald-50 text-emerald-900 border border-emerald-200",
          geoState === 'denied' && "bg-amber-50 text-amber-900 border border-amber-200",
          geoState === 'error' && "bg-gray-50 text-gray-800 border border-gray-200",
          geoState === 'detecting' && "bg-blue-50 text-blue-900 border border-blue-200"
        )}>
          {geoState === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {geoState === 'denied' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
          {geoState === 'error' && <AlertCircle className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />}
          {geoState === 'detecting' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />}
          <div className="flex-1 leading-relaxed">
            {geoMessage}
          </div>
          {geoState !== 'detecting' && (
            <button 
              type="button" 
              onClick={() => setGeoState('idle')}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 2. Saved Addresses Carousel (if user has saved addresses) */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#7A6848] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary" />
            <span>Select from Saved Addresses</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {savedAddresses.map((saved, idx) => {
              const isSelected = address.address === saved.address && address.pincode === saved.pincode;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSavedAddress(saved)}
                  className={cn(
                    "min-w-[190px] max-w-[240px] text-left p-3 rounded-xl border text-xs transition-all shrink-0 cursor-pointer",
                    isSelected 
                      ? "bg-emerald-50/80 border-[#1B5E3B] text-primary shadow-xs ring-1 ring-[#1B5E3B]"
                      : "bg-white border-[#DDD0B5] hover:border-primary/40 text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#DDD0B5]">
                      {saved.tag || 'Address'}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1B5E3B]" />}
                  </div>
                  <div className="font-bold truncate text-gray-900">{saved.name}</div>
                  <div className="text-[11px] text-gray-600 truncate">{saved.address}</div>
                  <div className="text-[10px] text-[#7A6848] font-semibold">{saved.city}, {saved.pincode}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Address Form with Mobile-First Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 sm:p-7 rounded-3xl border border-[#EEE0BC] shadow-sm">
        
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-primary" /> Full Name *
          </label>
          <Input 
            name="name" 
            autoComplete="name"
            value={address.name} 
            onChange={(e) => handleFieldChange('name', e.target.value)} 
            placeholder="e.g. Ramesh Patel" 
            className={cn(
              "h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
              errors.name && "border-red-500 bg-red-50/30"
            )} 
          />
          {errors.name && <span className="text-[10px] text-red-600 font-bold block">{errors.name}</span>}
        </div>

        {/* Mobile Number with Indian +91 Prefix */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <Phone className="w-3 h-3 text-primary" /> Mobile Number *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-bold text-[#7A6848] select-none pointer-events-none">
              🇮🇳 +91
            </span>
            <Input 
              name="phone" 
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={address.phone} 
              onChange={(e) => handleFieldChange('phone', e.target.value)} 
              placeholder="10-digit number" 
              className={cn(
                "h-12 pl-16 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
                errors.phone && "border-red-500 bg-red-50/30"
              )} 
            />
          </div>
          {errors.phone && <span className="text-[10px] text-red-600 font-bold block">{errors.phone}</span>}
        </div>

        {/* Complete Street Address */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3 text-primary" /> Flat / House No., Landmark, Street Address *
          </label>
          <Input 
            name="address" 
            autoComplete="street-address"
            value={address.address} 
            onChange={(e) => handleFieldChange('address', e.target.value)} 
            placeholder="e.g. 204, Shanti Heights, Near Gayatri Temple, Station Road" 
            className={cn(
              "h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
              errors.address && "border-red-500 bg-red-50/30"
            )} 
          />
          {errors.address && <span className="text-[10px] text-red-600 font-bold block">{errors.address}</span>}
        </div>

        {/* Pincode with Instant Auto-Verify */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              PIN Code *
            </label>
            {pincodeLookupState === 'checking' && (
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying
              </span>
            )}
            {pincodeLookupState === 'verified' && (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
              </span>
            )}
          </div>

          <Input 
            name="pincode" 
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={address.pincode} 
            onChange={(e) => handleFieldChange('pincode', e.target.value)} 
            placeholder="6-digit PIN code" 
            className={cn(
              "h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
              errors.pincode && "border-red-500 bg-red-50/30"
            )} 
          />
          {pincodeNotice && (
            <span className={cn(
              "text-[10px] font-medium block",
              pincodeLookupState === 'verified' ? "text-emerald-700" : "text-gray-500"
            )}>
              {pincodeNotice}
            </span>
          )}
          {errors.pincode && <span className="text-[10px] text-red-600 font-bold block">{errors.pincode}</span>}
        </div>

        {/* City & State (Auto-populated or Editable) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              City / District *
            </label>
            <Input 
              name="city" 
              autoComplete="address-level2"
              value={address.city} 
              onChange={(e) => handleFieldChange('city', e.target.value)} 
              placeholder="City" 
              className={cn(
                "h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
                errors.city && "border-red-500 bg-red-50/30"
              )} 
            />
            {errors.city && <span className="text-[10px] text-red-600 font-bold block">{errors.city}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              State *
            </label>
            <Input 
              name="state" 
              autoComplete="address-level1"
              value={address.state} 
              onChange={(e) => handleFieldChange('state', e.target.value)} 
              placeholder="State" 
              className="h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary" 
            />
          </div>
        </div>

        {/* Address Tag Selector & Save Button */}
        <div className="md:col-span-2 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#7A6848] uppercase tracking-wider">Label as:</span>
            {(['Home', 'Work', 'Other'] as const).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                  selectedTag === tag 
                    ? "bg-primary text-white shadow-xs" 
                    : "bg-[#F5EFE1] text-[#7A6848] hover:bg-[#EEE0BC]"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveCurrentAddress}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Address</span>
          </button>
        </div>

      </div>
    </div>
  );
};
