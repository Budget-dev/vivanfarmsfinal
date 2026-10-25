"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  Loader2,
  Phone,
  User,
  Building,
  Sparkles,
  Compass
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LeafletLocationPicker } from './LeafletLocationPicker';

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

  // Map & Geolocation states (Clean, zero technical library names)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
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
    ].slice(0, 4);

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

  // Indian Pincode Auto-Lookup via India Post API
  const handlePincodeLookup = useCallback(async (code: string) => {
    const cleanPincode = code.trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setPincodeLookupState('idle');
      setPincodeNotice('');
      return;
    }

    setPincodeLookupState('checking');
    setPincodeNotice('Verifying PIN code...');

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
        cache: 'force-cache'
      });
      const data = await res.json();

      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const detectedCity = postOffice.District || postOffice.Block || postOffice.Name || '';
        const detectedState = postOffice.State || '';
        const areaName = postOffice.Name || '';

        onChange({
          ...address,
          pincode: cleanPincode,
          city: detectedCity || address.city,
          state: detectedState || address.state,
          address: address.address 
            ? address.address 
            : (areaName && areaName !== detectedCity ? `${areaName}, ${detectedCity}` : address.address)
        });

        setPincodeLookupState('verified');
        setPincodeNotice(`${detectedCity}, ${detectedState}`);
      } else {
        setPincodeLookupState('failed');
        setPincodeNotice('PIN code accepted. Please confirm City and State.');
      }
    } catch {
      setPincodeLookupState('failed');
      setPincodeNotice('Postal lookup offline. Please enter City & State manually.');
    }
  }, [address, onChange]);

  // Reverse geocodes coordinates to complete Indian street address
  const reverseGeocodeCoords = async (latitude: number, longitude: number) => {
    let road = '';
    let city = '';
    let state = '';
    let pincode = '';
    let locality = '';
    let houseNumber = '';

    // 1. Primary: BigDataCloud Reverse Geocode (Fast, accurate locality for India)
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

        const adminLevels = bdc.localityInfo?.administrative || [];
        const neighborhood = adminLevels.find((a: any) => a.order >= 10)?.name;
        if (neighborhood && neighborhood !== city) {
          locality = [neighborhood, locality].filter(Boolean).join(', ');
        }
      }
    } catch (e) {
      console.warn('BigDataCloud geocode notice:', e);
    }

    // 2. Secondary: OpenStreetMap Nominatim for street/building level detail
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { credentials: 'omit' }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        road = addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.residential || road;
        city = city || addr.city || addr.town || addr.village || addr.county || addr.district || '';
        state = state || addr.state || '';
        pincode = pincode || (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
        houseNumber = addr.house_number || '';
      }
    } catch (e) {
      console.warn('Nominatim geocode notice:', e);
    }

    const fullStreet = [houseNumber, road, locality].filter(Boolean).join(', ');
    return { street: fullStreet, city, state, pincode };
  };

  // Resilient multi-provider network IP geolocation fallback
  const detectLocationByIP = async () => {
    try {
      const bdcRes = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (bdcRes.ok) {
        const data = await bdcRes.json();
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        const pincode = (data.postcode || '').replace(/\D/g, '').slice(0, 6);
        const locality = data.locality || '';
        if (city || state) {
          return { city, state, pincode, locality, lat: data.latitude, lng: data.longitude };
        }
      }
    } catch (e) {
      console.warn('BigDataCloud IP detection notice:', e);
    }

    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          return {
            city: data.city || '',
            state: data.region || '',
            pincode: (data.postal || '').replace(/\D/g, '').slice(0, 6),
            locality: '',
            lat: data.latitude,
            lng: data.longitude
          };
        }
      }
    } catch (e) {
      console.warn('ipwho.is notice:', e);
    }

    try {
      const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (geoRes.ok) {
        const data = await geoRes.json();
        return {
          city: data.city || '',
          state: data.region || '',
          pincode: '',
          locality: '',
          lat: Number(data.latitude),
          lng: Number(data.longitude)
        };
      }
    } catch (e) {
      console.warn('geojs.io notice:', e);
    }

    return null;
  };

  /**
   * One-Click Auto-Fill: Fills ALL address fields (Street, City, State, PIN code) at once!
   */
  const handleUseCurrentLocation = useCallback(async (isSilent: boolean | unknown = false) => {
    const silent = isSilent === true;
    if (!silent) {
      setGeoState('detecting');
      setGeoMessage('Detecting your live location...');
    }

    const applyIPFallback = async (fallbackNotice?: string) => {
      const ipResult = await detectLocationByIP();
      if (ipResult && (ipResult.city || ipResult.state || ipResult.pincode)) {
        let finalPincode = ipResult.pincode;
        let finalStreet = ipResult.locality || (ipResult.city ? `${ipResult.city} Area` : '');
        let finalCity = ipResult.city || '';
        let finalState = ipResult.state || '';

        // If postal code is missing but coords exist, reverse geocode to fetch 6-digit Indian PIN
        if ((!finalPincode || !finalStreet) && ipResult.lat && ipResult.lng) {
          try {
            const enriched = await reverseGeocodeCoords(ipResult.lat, ipResult.lng);
            finalPincode = enriched.pincode || finalPincode;
            finalStreet = enriched.street || finalStreet;
            finalCity = enriched.city || finalCity;
            finalState = enriched.state || finalState;
          } catch {}
        }

        // Enter ALL fields at one time!
        onChange({
          ...address,
          address: finalStreet || address.address,
          city: finalCity || address.city,
          state: finalState || address.state,
          pincode: finalPincode || address.pincode,
        });

        setGeoState('success');
        setGeoMessage(`Address auto-filled: ${[finalCity, finalState, finalPincode].filter(Boolean).join(', ')}.`);

        if (finalPincode && finalPincode.length === 6) {
          handlePincodeLookup(finalPincode);
        }
        return true;
      }

      if (!silent) {
        setGeoState('error');
        setGeoMessage(fallbackNotice || 'Could not auto-detect location. Please enter address manually.');
      }
      return false;
    };

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      await applyIPFallback('Location service unavailable on device. Located via network.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocodeCoords(latitude, longitude);

          if (geo.city || geo.state || geo.pincode || geo.street) {
            const fullStreet = geo.street || (geo.city ? `${geo.city} Area` : '');
            const finalCity = geo.city || '';
            const finalState = geo.state || '';
            const finalPincode = geo.pincode || '';

            // Enter ALL fields at one time!
            onChange({
              ...address,
              address: fullStreet || address.address,
              city: finalCity || address.city,
              state: finalState || address.state,
              pincode: finalPincode || address.pincode,
            });

            setGeoState('success');
            setGeoMessage(`Address auto-filled: ${[finalCity, finalState, finalPincode].filter(Boolean).join(', ')}.`);

            if (finalPincode && finalPincode.length === 6) {
              handlePincodeLookup(finalPincode);
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
        await applyIPFallback(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'GPS permission denied. Located via network — all fields auto-filled.'
            : 'GPS timed out. Located via network — all fields auto-filled.'
        );
      },
      { timeout: 4000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }, [address, handlePincodeLookup, onChange]);

  // Automatic location detection on mount if address fields are blank
  const hasAttemptedMountDetection = useRef(false);
  useEffect(() => {
    if (hasAttemptedMountDetection.current) return;
    if (!address.city && !address.pincode && !address.address) {
      hasAttemptedMountDetection.current = true;
      handleUseCurrentLocation(true);
    }
  }, [address.city, address.pincode, address.address, handleUseCurrentLocation]);

  const handleFieldChange = (name: keyof ShippingAddress, value: string) => {
    let formattedValue = value;
    if (name === 'phone') {
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
    <div className={`space-y-5 ${className}`}>
      {/* ── 1. Streamlined One-Click Location Auto-Fill Bar ── */}
      <div className="bg-[#FAF7EF] p-3.5 sm:p-4 rounded-2xl border border-[#EEE0BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-[#EBB847]" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[#0D3B2E] uppercase tracking-wider">
              Doorstep Delivery Location
            </h3>
            <p className="text-[11px] text-[#7A6848] font-medium leading-tight">
              Auto-fill all address fields in one click or select on map
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main 1-Click Auto-Fill Button */}
          <button
            type="button"
            onClick={() => handleUseCurrentLocation(false)}
            disabled={geoState === 'detecting'}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D3B2E] hover:bg-[#14472D] text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {geoState === 'detecting' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-[#EBB847]" />
                <span>Auto-Fill My Location</span>
              </>
            )}
          </button>

          {/* Clean Map Picker Button */}
          <button
            type="button"
            onClick={() => setIsMapPickerOpen(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#0D3B2E]/30 text-[#0D3B2E] text-xs font-bold uppercase tracking-wider hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isMapPickerOpen ? 'Hide Map' : 'Pin on Map'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Map Location Picker (No Technical Jargon) ── */}
      {isMapPickerOpen && (
        <LeafletLocationPicker
          onLocationSelect={(loc) => {
            // Populate ALL fields at one time
            onChange({
              ...address,
              address: loc.address || address.address,
              city: loc.city || address.city,
              state: loc.state || address.state,
              pincode: loc.pincode || address.pincode,
            });
            setGeoState('success');
            setGeoMessage(`Address auto-filled: ${[loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}.`);
            if (loc.pincode && loc.pincode.length === 6) {
              handlePincodeLookup(loc.pincode);
            }
            setIsMapPickerOpen(false);
            toast({
              title: "Address Auto-Filled",
              description: "All doorstep address fields have been populated from map pin.",
            });
          }}
          onClose={() => setIsMapPickerOpen(false)}
        />
      )}

      {/* Geolocation Feedback Banner */}
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
          <div className="flex-1 font-semibold leading-relaxed">
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

      {/* ── 3. Saved Addresses Carousel (if available) ── */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#7A6848] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary" />
            <span>Saved Addresses</span>
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

      {/* ── 4. Clean, Simplified Address Form ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 sm:p-7 rounded-3xl border border-[#EEE0BC] shadow-sm">
        
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-[#0D3B2E]" /> Full Name *
          </label>
          <Input 
            name="name" 
            autoComplete="name"
            value={address.name} 
            onChange={(e) => handleFieldChange('name', e.target.value)} 
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
            <Phone className="w-3 h-3 text-[#0D3B2E]" /> Mobile Number *
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
            <Building className="w-3 h-3 text-[#0D3B2E]" /> Flat / House No., Landmark, Street Address *
          </label>
          <Input 
            name="address" 
            autoComplete="street-address"
            value={address.address} 
            onChange={(e) => handleFieldChange('address', e.target.value)} 
            className={cn(
              "h-12 rounded-xl bg-[#FDFBFA] border-[#DDD0B5] text-sm font-semibold focus:border-primary",
              errors.address && "border-red-500 bg-red-50/30"
            )} 
          />
          {errors.address && <span className="text-[10px] text-red-600 font-bold block">{errors.address}</span>}
        </div>

        {/* PIN Code with Instant Postal Auto-Fill */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              PIN Code *
            </label>
            {pincodeLookupState === 'checking' && (
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
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

        {/* City & State (Auto-populated from Location or Pincode) */}
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
                    ? "bg-[#0D3B2E] text-white shadow-xs" 
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
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0D3B2E] hover:underline cursor-pointer py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Address</span>
          </button>
        </div>

      </div>
    </div>
  );
};
