import React, { useState } from "react";
import { useCSVReader } from "react-papaparse";
import TripMap from "./TripMap";

function App() {
  const { CSVReader } = useCSVReader();

  const [allTrips, setAllTrips] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [filteredTrips, setFilteredTrips] = useState([]);

  function smartLatLon(value) {
    if (!value) return null;

    // remove all commas
    const clean = value.replace(/,/g, "");

    // must be at least 4 digits
    if (clean.length < 4) return null;

    // first 2 or 3 digits = degrees
    const isNegative = clean.startsWith("-");
    const abs = isNegative ? clean.slice(1) : clean;

    // degrees is ALWAYS first 2 digits for SA region
    const degrees = abs.slice(0, 2);
    const decimals = abs.slice(2);

    const formatted = (isNegative ? "-" : "") + degrees + "." + decimals;

    return parseFloat(formatted);
  }

  const fixLatLon = smartLatLon;

  const handleCSV = (results) => {
    const rows = results.data;
    if (!rows || rows.length < 2) return;

    const headers = rows[0];
    const idxUid = headers.indexOf("vehicle_uid");
    const idxLat = headers.indexOf("latitude");
    const idxLon = headers.indexOf("longitude");
    const idxTime = headers.indexOf("gps_datetime");

    const tripsByVehicle = {};

    rows.slice(1).forEach((row) => {
      const vehicle = row[idxUid];
      if (!vehicle) return;

      const rawLat = row[idxLat];
      const rawLon = row[idxLon];

      const lat = fixLatLon(rawLat);
      const lon = fixLatLon(rawLon);
      const time = new Date(row[idxTime]);

      if (lat === null || lon === null) return;

      if (!tripsByVehicle[vehicle]) tripsByVehicle[vehicle] = [];

      tripsByVehicle[vehicle].push({ lat, lon, time });
    });

    // Sort chronologically
    Object.keys(tripsByVehicle).forEach((v) => {
      tripsByVehicle[v].sort((a, b) => a.time - b.time);
    });

    // Build ONE continuous line per vehicle
    const finalTrips = Object.keys(tripsByVehicle).map((vehicle) => {
      const pts = tripsByVehicle[vehicle];

      const cleaned = pts.filter(
        (p, i) =>
          p.lat !== null &&
          p.lon !== null &&
          !isNaN(p.lat) &&
          !isNaN(p.lon) &&
          (i === 0 || p.lat !== pts[i - 1].lat || p.lon !== pts[i - 1].lon)
      );

      return {
        vehicle,
        coords: cleaned.map((p) => [p.lat, p.lon]),
      };
    });

    setAllTrips(finalTrips);

    const first = finalTrips[0]?.vehicle || "";
    setSelectedVehicle(first);
    setFilteredTrips(finalTrips.filter((t) => t.vehicle === first));
  };

  const handleVehicleChange = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFilteredTrips(allTrips.filter((t) => t.vehicle === vehicle));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 className="text-3xl font-bold underline">Trip Visualizer</h1>

      <CSVReader
        config={{
          delimiter: ",",
          skipEmptyLines: true,
        }}
        onUploadAccepted={handleCSV}
      >
        {({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps }) => (
          <div style={{ marginTop: "20px" }}>
            <button {...getRootProps()}>Browse CSV</button>

            {acceptedFile && (
              <>
                <span style={{ marginLeft: "10px" }}>{acceptedFile.name}</span>
                <button
                  {...getRemoveFileProps()}
                  style={{
                    marginLeft: "10px",
                    background: "red",
                    color: "white",
                  }}
                >
                  Remove
                </button>
              </>
            )}

            <ProgressBar style={{ height: "5px", background: "orange" }} />
          </div>
        )}
      </CSVReader>

      {allTrips.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <label>Select Vehicle: </label>
          <select
            value={selectedVehicle}
            onChange={(e) => handleVehicleChange(e.target.value)}
            style={{ padding: "8px", marginLeft: "10px" }}
          >
            {allTrips.map((t) => (
              <option key={t.vehicle} value={t.vehicle}>
                {t.vehicle}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        {filteredTrips.length > 0 ? (
          <TripMap trips={filteredTrips} />
        ) : (
          <p>Upload a CSV to display trips.</p>
        )}
      </div>
    </div>
  );
}

export default App;
