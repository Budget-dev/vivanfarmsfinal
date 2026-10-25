"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Loader2, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeafletLocationPickerProps {
  onLocationSelect: (data: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  }) => void;
  onClose?: () => void;
  className?: string;
}

export const LeafletLocationPicker: React.FC<LeafletLocationPickerProps> = ({
  onLocationSelect,
  onClose,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing map and detecting live GPS location...');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<{
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Reverse geocode lat/lng to Indian address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    let road = '';
    let city = '';
    let state = '';
    let pincode = '';
    let locality = '';
    let houseNumber = '';

    try {
      // 1. BigDataCloud fast client geocoder
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        city = bdc.city || bdc.locality || '';
        state = bdc.principalSubdivision || '';
        locality = bdc.locality || '';
        pincode = (bdc.postcode || '').replace(/\D/g, '').slice(0, 6);
      }
    } catch (e) {
      console.warn('BigDataCloud error:', e);
    }

    try {
      // 2. OpenStreetMap Nominatim reverse geocode
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (nomRes.ok) {
        const nom = await nomRes.json();
        const a = nom.address || {};
        road = a.road || a.street || a.suburb || a.neighbourhood || a.residential || road;
        city = a.city || a.town || a.village || a.county || a.district || city;
        state = a.state || state;
        pincode = (a.postcode || '').replace(/\D/g, '').slice(0, 6) || pincode;
        houseNumber = a.house_number || '';
      }
    } catch (e) {
      console.warn('Nominatim error:', e);
    }

    const fullStreet = [houseNumber, road, locality].filter(Boolean).join(', ');
    const result = {
      address: fullStreet,
      city,
      state,
      pincode,
    };

    setDetectedAddress(result);
    setIsReverseGeocoding(false);
    return result;
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      try {
        // Dynamically load leaflet and styles on client-side
        const L = (await import('leaflet')).default;
        try {
          // @ts-ignore
          await import('leaflet/dist/leaflet.css');
        } catch {
          // Fallback stylesheet if direct CSS import is not bundled
          if (!document.getElementById('leaflet-css-cdn')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css-cdn';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }
        }

        if (!isMounted || !mapContainerRef.current) return;

        // If map already exists on container, clean it up
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Create custom emerald pin icon
        const customPinIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="position: relative; width: 34px; height: 34px;">
              <div style="
                width: 32px; 
                height: 32px; 
                background: #0D3B2E; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                border: 2.5px solid #FFFFFF; 
                box-shadow: 0 4px 14px rgba(13,59,46,0.4); 
                display: flex; 
                align-items: center; 
                justify-content: center;
              ">
                <div style="
                  width: 9px; 
                  height: 9px; 
                  background: #EBB847; 
                  border-radius: 50%; 
                  transform: rotate(45deg);
                "></div>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        // Default coordinates: Central India fallback [20.5937, 78.9629]
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([20.5937, 78.9629], 5);

        // Add sleek OpenStreetMap Carto tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Add top-right zoom control
        L.control.zoom({ position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;

        // Leaflet real-time location detection
        setStatusMessage('Requesting GPS live coordinates...');
        map.locate({
          setView: true,
          maxZoom: 16,
          enableHighAccuracy: true,
          timeout: 10000,
        });

        // On Location Found
        map.on('locationfound', async (e: any) => {
          if (!isMounted) return;
          const { lat, lng } = e.latlng;
          setCurrentCoords({ lat, lng });
          setStatusMessage('Live location detected. Reverse geocoding address...');

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              icon: customPinIcon,
              draggable: true,
            }).addTo(map);

            marker.on('dragend', async () => {
              const newPos = marker.getLatLng();
              setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });
              setStatusMessage('Pin moved. Updating address...');
              await reverseGeocode(newPos.lat, newPos.lng);
              setStatusMessage('Address updated from pin.');
            });

            markerRef.current = marker;
          }

          map.setView([lat, lng], 16);
          await reverseGeocode(lat, lng);
          setIsLoading(false);
          setStatusMessage('Location found! Move pin if needed or click confirm.');
        });

        // On Location Error (fallback to IP or manual pin)
        map.on('locationerror', async (err: any) => {
          if (!isMounted) return;
          console.warn('Leaflet locationerror:', err.message);
          setStatusMessage('GPS unavailable. Click anywhere on the map to pin your location.');
          setIsLoading(false);

          // Attempt IP geolocation fallback
          try {
            let lat: number | null = null;
            let lng: number | null = null;
            let cityName = '';

            try {
              const bdcRes = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
              if (bdcRes.ok) {
                const bdc = await bdcRes.json();
                if (bdc.latitude && bdc.longitude) {
                  lat = bdc.latitude;
                  lng = bdc.longitude;
                  cityName = bdc.city || bdc.locality || '';
                }
              }
            } catch {}

            if (!lat || !lng) {
              const ipRes = await fetch('https://ipwho.is/');
              if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData && ipData.latitude && ipData.longitude) {
                  lat = ipData.latitude;
                  lng = ipData.longitude;
                  cityName = ipData.city || '';
                }
              }
            }

            if (lat && lng && isMounted) {
              map.setView([lat, lng], 13);
              setCurrentCoords({ lat, lng });

              const marker = L.marker([lat, lng], {
                icon: customPinIcon,
                draggable: true,
              }).addTo(map);

              marker.on('dragend', async () => {
                const newPos = marker.getLatLng();
                setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });
                await reverseGeocode(newPos.lat, newPos.lng);
              });

              markerRef.current = marker;
              await reverseGeocode(lat, lng);
              setStatusMessage(`Network location: ${cityName}. Move pin to exact doorstep.`);
            }
          } catch {
            // Keep default
          }
        });

        // Allow clicking anywhere on the map to re-position pin
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          setCurrentCoords({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              icon: customPinIcon,
              draggable: true,
            }).addTo(map);

            marker.on('dragend', async () => {
              const newPos = marker.getLatLng();
              setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });
              await reverseGeocode(newPos.lat, newPos.lng);
            });

            markerRef.current = marker;
          }

          setStatusMessage('Pin updated. Geocoding new location...');
          await reverseGeocode(lat, lng);
          setStatusMessage('Location updated.');
        });
      } catch (err) {
        console.error('Failed to initialize Leaflet map:', err);
        if (isMounted) {
          setIsLoading(false);
          setStatusMessage('Map could not be loaded. Please enter address manually.');
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [reverseGeocode]);

  // Re-trigger live GPS locate
  const handleRelocate = () => {
    if (mapInstanceRef.current) {
      setIsLoading(true);
      setStatusMessage('Re-detecting live GPS coordinates...');
      mapInstanceRef.current.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
        timeout: 10000,
      });
    }
  };

  const handleConfirm = () => {
    if (!detectedAddress || !currentCoords) return;
    onLocationSelect({
      address: detectedAddress.address,
      city: detectedAddress.city,
      state: detectedAddress.state,
      pincode: detectedAddress.pincode,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
    });
    if (onClose) onClose();
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-[#EEE0BC] shadow-lg overflow-hidden", className)}>
      {/* Header Bar */}
      <div className="bg-[#FAF7EF] px-4 py-3 border-b border-[#EEE0BC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[#0D3B2E] uppercase tracking-wider">
              Live Location via Leaflet JS
            </h3>
            <p className="text-[10px] text-[#7A6848] font-medium leading-tight">
              Real-time GPS detection & doorstep pin positioning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRelocate}
            title="Re-fetch Live GPS"
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#0D3B2E] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[220px] sm:h-[280px] bg-[#EAE5D9]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-[#0D3B2E] animate-spin" />
            <span className="text-xs font-bold text-[#0D3B2E]">Detecting your GPS position...</span>
          </div>
        )}

        {/* Floating Instruction Chip */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-[10.5px] font-medium text-gray-700 flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-[#0D3B2E] shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        </div>
      </div>

      {/* Geocoded Address Summary & Confirm Button */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-wider mb-0.5">
            Detected Address
          </div>
          {isReverseGeocoding ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin text-[#0D3B2E]" />
              <span>Fetching street details...</span>
            </div>
          ) : detectedAddress ? (
            <div className="text-xs font-bold text-[#0D3B2E] leading-snug">
              {detectedAddress.address ? `${detectedAddress.address}, ` : ''}
              {[detectedAddress.city, detectedAddress.state, detectedAddress.pincode].filter(Boolean).join(', ')}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Click on the map or tap locate to detect address.</div>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!detectedAddress || isReverseGeocoding}
          className="h-10 px-5 rounded-full bg-[#0D3B2E] hover:bg-[#144E3F] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply This Location</span>
        </button>
      </div>
    </div>
  );
};
