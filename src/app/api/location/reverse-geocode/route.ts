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

          return NextResponse.json({
            success: true,
            provider: "google_maps",
            address: {
              street: street || first.formatted_address?.split(",")[0] || "Street address",
              apartment: sublocality,
              city: city || "City",
              state: state || "State",
              postalCode: postalCode.replace(/\D/g, "").slice(0, 6),
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
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.district || "";
        const state = addr.state || "";
        const postalCode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

        return NextResponse.json({
          success: true,
          provider: "openstreetmap",
          address: {
            street: street || addr.suburb || data.display_name?.split(",")[0] || "Street address",
            apartment: addr.neighbourhood || addr.suburb || "",
            city: city || "City",
            state: state || "State",
            postalCode,
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
        const postalCode = (bdc.postcode || "").replace(/\D/g, "").slice(0, 6);
        const street = [bdc.locality, bdc.neighbourhood].filter(Boolean).join(", ");

        return NextResponse.json({
          success: true,
          provider: "bigdatacloud",
          address: {
            street: street || city || "Street address",
            apartment: bdc.locality || "",
            city: city || "City",
            state: state || "State",
            postalCode,
            country: bdc.countryName || "India",
            formattedAddress: [street, city, state, postalCode].filter(Boolean).join(", "),
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
