import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, TrendingUp } from "lucide-react";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const competitorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Competitor {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type?: string;
}

interface Props {
  lat: number;
  lon: number;
  businessType: string;
  businessName: string;
}

const OVERPASS_TAGS: Record<string, string> = {
  dental: '["healthcare"="dentist"]',
  medspa: '["healthcare"="clinic"]["healthcare:speciality"~"dermatology|cosmetic"]',
  chiropractic: '["healthcare"="chiropractor"]',
  veterinary: '["amenity"="veterinary"]',
  optometry: '["healthcare"="optometrist"]',
  dermatology: '["healthcare"="clinic"]["healthcare:speciality"="dermatology"]',
  other_medical: '["amenity"="clinic"]',
};

// Fallback broader tags
const OVERPASS_FALLBACK: Record<string, string> = {
  dental: '["amenity"="dentist"]',
  medspa: '["shop"="beauty"]',
  chiropractic: '["amenity"="clinic"]',
  veterinary: '["amenity"="veterinary"]',
  optometry: '["shop"="optician"]',
  dermatology: '["amenity"="clinic"]',
  other_medical: '["amenity"="doctors"]',
};

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], 13); }, [lat, lon, map]);
  return null;
}

const CompetitorMap = ({ lat, lon, businessType, businessName }: Props) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCompetitors = async () => {
      setLoading(true);
      setError("");

      const radiusM = 8000; // 8km ≈ 5 miles
      const tag = OVERPASS_TAGS[businessType] || '["amenity"="clinic"]';
      const fallback = OVERPASS_FALLBACK[businessType] || '["amenity"="doctors"]';

      const query = `
        [out:json][timeout:15];
        (
          node${tag}(around:${radiusM},${lat},${lon});
          way${tag}(around:${radiusM},${lat},${lon});
          node${fallback}(around:${radiusM},${lat},${lon});
          way${fallback}(around:${radiusM},${lat},${lon});
        );
        out center 30;
      `;

      try {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const data = await res.json();

        const seen = new Set<string>();
        const results: Competitor[] = [];
        for (const el of data.elements || []) {
          const name = el.tags?.name;
          if (!name) continue;
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (elLat && elLon) {
            results.push({ id: el.id, name, lat: elLat, lon: elLon, type: el.tags?.healthcare || el.tags?.amenity });
          }
        }
        setCompetitors(results);
      } catch {
        setError("Could not load competitor data. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitors();
  }, [lat, lon, businessType]);

  const competitorCount = competitors.length;
  const density = competitorCount >= 10 ? "high" : competitorCount >= 4 ? "medium" : "low";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Market Competition — 5 Mile Radius
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Scanning nearby competitors…</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-4 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <Badge variant={density === "high" ? "destructive" : density === "medium" ? "default" : "secondary"}>
                  {density === "high" ? "High Competition" : density === "medium" ? "Moderate Competition" : "Low Competition"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {competitorCount} similar {competitorCount === 1 ? "business" : "businesses"} found nearby
                </span>
              </div>

              <div className="rounded-lg overflow-hidden border border-border" style={{ height: 320 }}>
                <MapContainer center={[lat, lon]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap lat={lat} lon={lon} />
                  <Marker position={[lat, lon]} icon={userIcon}>
                    <Popup><strong>{businessName}</strong><br />Your business</Popup>
                  </Marker>
                  {competitors.map((c) => (
                    <Marker key={c.id} position={[c.lat, c.lon]} icon={competitorIcon}>
                      <Popup>{c.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {competitorCount > 0 && (
                <div className="mt-4 rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {density === "high"
                      ? "🔥 Your area is highly competitive — missed calls mean lost patients to these nearby practices."
                      : density === "medium"
                      ? "⚡ You have moderate competition — an AI receptionist ensures you never lose a caller to a competitor."
                      : "✅ Low competition is great, but every missed call still matters for growth."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Practices using AI voice reps answer 100% of calls and capture 3× more after-hours leads.
                  </p>
                </div>
              )}

              {competitorCount > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Nearby competitors:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {competitors.slice(0, 12).map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs font-normal">
                        {c.name}
                      </Badge>
                    ))}
                    {competitorCount > 12 && (
                      <Badge variant="outline" className="text-xs font-normal">+{competitorCount - 12} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitorMap;
