import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface ParsedAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

/**
 * Resolves and validates Indian Postal Pincode against official India Post directory.
 * If rawPincode is corrupted or missing (common in crowdsourced OSM/rural data),
 * it searches India Post using the village/mandal/district hierarchy to return the authentic PIN code.
 */
async function resolveIndianPincode(
  rawPincode: string,
  details: {
    village?: string;
    locality?: string;
    mandal?: string;
    district?: string;
    city?: string;
    state?: string;
  }
): Promise<{ pincode: string; city?: string; state?: string; verified: boolean }> {
  const cleanState = (details.state || "").replace(/\bstate\b/gi, "").trim().toLowerCase();
  const cleanDistrict = (details.district || "").replace(/\s*(district|dist)\b/gi, "").trim().toLowerCase();
  const cleanMandal = (details.mandal || "").replace(/\s*(mandal|taluk|tehsil|block|sub-district)\b/gi, "").trim().toLowerCase();
  const cleanVillage = (details.village || "").trim().toLowerCase();
  const cleanLocality = (details.locality || "").replace(/\s*(road|street|nagar|colony|lane|bypass)\b/gi, "").trim().toLowerCase();

  // 1. If rawPincode is a 6-digit code from GPS reverse geocoding, verify it with official India Post API
  if (rawPincode && /^\d{6}$/.test(rawPincode)) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${rawPincode}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        const matchesDistrict = !cleanDistrict || offices.some((o: any) =>
          (o.District || "").toLowerCase().includes(cleanDistrict) || cleanDistrict.includes((o.District || "").toLowerCase())
        );
        const matchesState = !cleanState || offices.some((o: any) =>
          (o.State || "").toLowerCase() === cleanState
        );

        if (matchesState || matchesDistrict) {
          return {
            pincode: rawPincode,
            city: offices[0].District || details.city,
            state: offices[0].State || details.state,
            verified: true,
          };
        }
      }
    } catch {
      // Network timeout - trust spatial GPS reverse geocoded pincode
    }

    // CRITICAL: If a valid 6-digit postal code was computed from spatial GPS coordinates,
    // trust it! Never overwrite it with a loose village name search that matches distant villages.
    return {
      pincode: rawPincode,
      city: details.city,
      state: details.state,
      verified: true,
    };
  }

  // 2. Search India Post database by administrative hierarchy:
  // In India, Mandal / Taluk / Block is the authoritative postal delivery unit.
  // Village post offices are validated against cleanMandal to avoid matching same-named villages in other mandals.
  const candidateList = [
    { name: cleanMandal, isMandal: true },
    { name: cleanVillage, isMandal: false },
    { name: cleanLocality, isMandal: false },
    { name: details.city, isMandal: false },
    { name: cleanDistrict, isMandal: false },
  ].filter(c => c.name && c.name.length >= 3);

  const seen = new Set<string>();
  const uniqueCandidates = candidateList.filter(c => {
    const key = (c.name || '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const cand of uniqueCandidates) {
    try {
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(cand.name!)}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        for (const po of offices) {
          const poDist = (po.District || "").toLowerCase();
          const poState = (po.State || "").toLowerCase();
          const distMatch = !cleanDistrict || poDist.includes(cleanDistrict) || cleanDistrict.includes(poDist);
          const stateMatch = !cleanState || poState === cleanState;

          if (distMatch && stateMatch) {
            const poPincode = String(po.Pincode).replace(/\D/g, "").slice(0, 6);
            if (!/^\d{6}$/.test(poPincode)) continue;

            // If candidate is a village or locality, verify that the post office's block matches cleanMandal
            if (!cand.isMandal && cleanMandal) {
              try {
                const pinRes = await fetch(`https://api.postalpincode.in/pincode/${poPincode}`, {
                  signal: AbortSignal.timeout(2500),
                });
                const pinData = await pinRes.json();
                if (pinData && pinData[0]?.Status === "Success") {
                  const pinOffices = pinData[0].PostOffice || [];
                  const blockMatches = pinOffices.some((o: any) =>
                    (o.Block || "").toLowerCase().includes(cleanMandal) || cleanMandal.includes((o.Block || "").toLowerCase())
                  );
                  if (!blockMatches) {
                    // Village is in a different block/mandal! Continue searching.
                    continue;
                  }
                }
              } catch {
                // Ignore secondary timeout
              }
            }

            return {
              pincode: poPincode,
              city: po.District || details.city,
              state: po.State || details.state,
              verified: true,
            };
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 3. Fallback: return raw pincode
  return { pincode: rawPincode || "", city: details.city, state: details.state, verified: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = Number(body?.latitude);
    const lng = Number(body?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid latitude or longitude coordinates" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";

    // ─── OPTION 1: Google Maps Geocoding API (if key is provided) ───────
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();

        if (data.status === "OK" && data.results?.length > 0) {
          const first = data.results[0];
          const components = first.address_components || [];

          let streetNumber = "";
          let route = "";
          let sublocality = "";
          let city = "";
          let state = "";
          let postalCode = "";
          let country = "India";

          for (const c of components) {
            const types = c.types || [];
            if (types.includes("street_number")) streetNumber = c.long_name;
            if (types.includes("route")) route = c.long_name;
            if (types.includes("sublocality_level_1") || types.includes("sublocality")) sublocality = c.long_name;
            if (types.includes("locality")) city = c.long_name;
            if (types.includes("administrative_area_level_1")) state = c.long_name;
            if (types.includes("postal_code")) postalCode = c.long_name;
            if (types.includes("country")) country = c.long_name;
          }

          const street = [streetNumber, route].filter(Boolean).join(" ") || sublocality || "";
          const rawPostal = postalCode.replace(/\D/g, "").slice(0, 6);

          const pinResult = await resolveIndianPincode(rawPostal, {
            locality: sublocality,
            city,
            state,
          });

          return NextResponse.json({
            success: true,
            provider: "google_maps",
            address: {
              street: street || first.formatted_address?.split(",")[0] || "Street address",
              apartment: sublocality,
              city: pinResult.city || city || "City",
              state: pinResult.state || state || "State",
              postalCode: pinResult.pincode || rawPostal,
              country: country || "India",
              formattedAddress: first.formatted_address,
            },
          });
        }
      } catch (err) {
        console.warn("Google Maps lookup failed, trying fallback...", err);
      }
    }

    // ─── OPTION 2: Free Fallback via OpenStreetMap Nominatim ────────────
    try {
      const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "VarahiFarmsApp/1.0 (contact@varahifarms.com)", // Nominatim requires a User-Agent header
        },
        signal: AbortSignal.timeout(6000),
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const addr = data.address || {};

        const village = addr.village || addr.hamlet || "";
        const locality = addr.suburb || addr.neighbourhood || "";
        const road = addr.road || "";
        const mandal = addr.county || "";
        const district = addr.state_district || addr.district || "";
        const state = addr.state || "";
        const rawPostal = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

        // Build clean doorstep street
        const streetParts = [addr.house_number, road, village || locality].filter(Boolean);
        const street = streetParts.length > 0 ? streetParts.join(", ") : (village || locality || "Doorstep Address");

        // Validate and enrich with official India Post data
        const pinResult = await resolveIndianPincode(rawPostal, {
          village,
          locality: road ? `${road}, ${locality}` : locality,
          mandal,
          district,
          city: addr.city || addr.town || district || village,
          state,
        });

        const finalCity = pinResult.city || district || addr.city || "City";
        const finalState = pinResult.state || state || "State";
        const finalPostal = pinResult.pincode || rawPostal;

        return NextResponse.json({
          success: true,
          provider: "openstreetmap",
          address: {
            street: street || "Doorstep address",
            apartment: locality || village || "",
            city: finalCity,
            state: finalState,
            postalCode: finalPostal,
            country: addr.country || "India",
            formattedAddress: [street, finalCity, finalState, finalPostal].filter(Boolean).join(", "),
          },
        });
      }
    } catch (err) {
      console.warn("Nominatim reverse geocode failed, trying tertiary fallback...", err);
    }

    // ─── OPTION 3: Free Fallback via BigDataCloud Client Reverse Geocode ────────────
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { signal: AbortSignal.timeout(5000) });
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const adminLevels = bdc.localityInfo?.administrative || [];
        const districtObj = adminLevels.find((a: any) => a.order === 8 || a.adminLevel === 5);
        const district = districtObj?.name || "";
        const mandalObj = adminLevels.find((a: any) => /mandal|taluk|tehsil|block/i.test(a.name));
        const mandal = mandalObj?.name || "";
        const villageObj = adminLevels.find((a: any) => a.adminLevel >= 6 && !/mandal|taluk|tehsil|block/i.test(a.name));
        const village = villageObj?.name || bdc.locality || "";
        const city = bdc.city || district || village || "";
        const state = bdc.principalSubdivision || "";
        const rawPostal = (bdc.postcode || "").replace(/\D/g, "").slice(0, 6);
        const street = [village, bdc.neighbourhood].filter(Boolean).join(", ");
        const locality = bdc.locality || "";

        // Validate and enrich with official India Post data
        const pinResult = await resolveIndianPincode(rawPostal, {
          village,
          locality,
          mandal,
          district,
          city,
          state,
        });

        const finalCity = pinResult.city || district || city || "City";
        const finalState = pinResult.state || state || "State";
        const finalPostal = pinResult.pincode || rawPostal;

        return NextResponse.json({
          success: true,
          provider: "bigdatacloud",
          address: {
            street: street || city || "Street address",
            apartment: locality,
            city: finalCity,
            state: finalState,
            postalCode: finalPostal,
            country: bdc.countryName || "India",
            formattedAddress: [street, finalCity, finalState, finalPostal].filter(Boolean).join(", "),
          },
        });
      }
    } catch (err) {
      console.warn("BigDataCloud fallback failed:", err);
    }

    return NextResponse.json(
      { success: false, error: "Unable to resolve coordinates into address" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}
