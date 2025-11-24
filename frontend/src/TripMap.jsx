import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function TripMap({ trips }) {
  const firstVehicle = trips[0];
  const coords = firstVehicle.coords;

  const center = coords?.[0] || [-25.677209, 27.241859];

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />

      <Polyline positions={coords} weight={4} color="blue" />
    </MapContainer>
  );
}
