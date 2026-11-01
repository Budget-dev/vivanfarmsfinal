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
  const { village, locality, mandal, district, city, state } = details;

  // 1. If rawPincode is a 6-digit code, verify it with official India Post API
  if (rawPincode && /^\d{6}$/.test(rawPincode)) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${rawPincode}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        return {
          pincode: rawPincode,
          city: data[0].PostOffice[0].District || city,
          state: data[0].PostOffice[0].State || state,
          verified: true,
        };
      }
    } catch {
      // Network timeout or offline - keep raw if verified check cannot complete
    }
  }

  // 2. If rawPincode was invalid/non-existent (e.g. OSM error like 531204) or missing:
  // Search India Post database by candidate location names in order of specificity
  const cleanMandal = mandal ? mandal.replace(/\s*(mandal|taluk|tehsil|block|sub-district)\b/gi, "").trim() : "";
  const cleanDistrict = district ? district.replace(/\s*(district|dist)\b/gi, "").trim() : "";
  const cleanVillage = village ? village.trim() : "";
  const cleanLocality = locality ? locality.trim() : "";
  const cleanCity = city ? city.trim() : "";

  const candidates = [cleanVillage, cleanLocality, cleanMandal, cleanCity, cleanDistrict].filter(Boolean);
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const name of uniqueCandidates) {
    if (!name || name.length < 3) continue;
    try {
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice;
        const targetState = (state || "").toLowerCase();
        const targetDistrict = (cleanDistrict || cleanCity || "").toLowerCase();

        // 1st priority: matches both district & state
        let match = postOffices.find(
          (po: any) =>
            (targetDistrict &&
              (po.District?.toLowerCase().includes(targetDistrict) ||
                targetDistrict.includes(po.District?.toLowerCase()))) &&
            (!targetState || po.State?.toLowerCase() === targetState)
        );

        // 2nd priority: matches state
        if (!match && targetState) {
          match = postOffices.find((po: any) => po.State?.toLowerCase() === targetState);
        }

        // 3rd priority: first matching post office
        if (!match) {
          match = postOffices[0];
        }

        if (match && match.Pincode) {
          return {
            pincode: String(match.Pincode).replace(/\D/g, "").slice(0, 6),
            city: match.District || city,
            state: match.State || state,
            verified: true,
          };
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Fallback: return raw pincode
  return { pincode: rawPincode || "", city, state, verified: false };
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

        const street = [addr.house_number, addr.road || addr.suburb || addr.neighbourhood].filter(Boolean).join(" ");
        const city = addr.village || addr.city || addr.town || addr.municipality || addr.county || addr.district || "";
        const state = addr.state || "";
        const rawPostal = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

        // Validate and enrich with official India Post data
        const pinResult = await resolveIndianPincode(rawPostal, {
          village: addr.village,
          locality: addr.suburb || addr.neighbourhood,
          mandal: addr.county,
          district: addr.state_district,
          city,
          state,
        });

        const finalCity = pinResult.city || city || "City";
        const finalState = pinResult.state || state || "State";
        const finalPostal = pinResult.pincode || rawPostal;

        return NextResponse.json({
          success: true,
          provider: "openstreetmap",
          address: {
            street: street || addr.suburb || data.display_name?.split(",")[0] || "Street address",
            apartment: addr.neighbourhood || addr.suburb || "",
            city: finalCity,
            state: finalState,
            postalCode: finalPostal,
            country: addr.country || "India",
            formattedAddress: data.display_name || "",
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
        const city = bdc.city || bdc.locality || "";
        const state = bdc.principalSubdivision || "";
        const rawPostal = (bdc.postcode || "").replace(/\D/g, "").slice(0, 6);
        const street = [bdc.locality, bdc.neighbourhood].filter(Boolean).join(", ");
        const locality = bdc.locality || "";

        const adminLevels = bdc.localityInfo?.administrative || [];
        const districtObj = adminLevels.find((a: any) => a.order === 8 || a.adminLevel === 5);
        const district = districtObj?.name || "";

        // Validate and enrich with official India Post data
        const pinResult = await resolveIndianPincode(rawPostal, {
          locality,
          district,
          city,
          state,
        });

        const finalCity = pinResult.city || city || "City";
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
