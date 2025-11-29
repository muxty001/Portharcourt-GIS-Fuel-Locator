// =========================
// INITIALIZE MAP
// =========================
var map = L.map("map").setView([4.85, 6.95], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

let stationLayer;
let allFeatures = []; // stores all stations

// =========================
// LOAD GEOJSON
// =========================
fetch("map.geojson")
  .then((res) => res.json())
  .then((data) => {
    allFeatures = data.features;

    stationLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        let p = feature.properties;

        const popup = `
                    <b>${p["Name of filling Station"]}</b><br>
                    <b>Address:</b> ${p["Address"]}<br>
                    <b>Nearest Road:</b> ${p["Nearest Major Road"]}<br>
                    <b>PMS Price:</b> ₦${p["Price of  PMS"]}<br>
                    <b>AGO Price:</b> ₦${p["Price of  A.G.O"]}<br>
                    <b>Queue:</b> ${p["Queue Status"]}<br>
                    <b>Pumps:</b> ${p["Number of Filling Station Pumps"]}<br>
                    <b>Products:</b> ${p["Number of Available Petrol Product ( PMS, A.G.O, DPK, LPG, Lubricants, Others)"]}<br>
                `;

        layer.bindPopup(popup);
      },

      pointToLayer: function (feature, latlng) {
        let price = Number(feature.properties["Price of  PMS"]) || 0;

        let color = price <= 900 ? "green" : price <= 950 ? "orange" : "red";

        return L.circleMarker(latlng, {
          radius: 7,
          fillColor: color,
          color: "#000",
          weight: 1,
          fillOpacity: 0.9,
        });
      },
    }).addTo(map);

    updateDashboard(); // Update cheapest 5
  });

// =========================
// SEARCH (KEYUP)
// =========================
document
  .getElementById("searchBox")
  .addEventListener("keyup", async function () {
    let text = this.value.toLowerCase();
    const res = await fetch("map.geojson");
    const data = await res.json();

    const filteredStation = data.features.filter((item) =>
      item.properties["Name of filling Station"].includes(text)
    );

    let list = document.getElementById("foundList");
    list.innerHTML = "";

 filteredStation.forEach((station) => {
    const p = station.properties;

    list.innerHTML += `
      <li class="station-item" onclick="searchStation('${text}')">
          <b>${p["Name of filling Station"]}</b><br>
          <span style="margin-right: 10px;">PMS: ₦${p["Price of  PMS"]}</span>
          <span style="margin-right: 10px;">AGO: ₦${p["Price of  A.G.O"]}</span>
          <span style="margin-right: 10px;">LPK: ₦${p["Price of  L.P.K"]}</span>
          <span style="margin-right: 10px;">LPG: ₦${p["Price of  L.G.P"]}</span>
      </li>
    `;
});


  });

// =========================
// SEARCH BUTTON
// =========================
document.getElementById("searchBtn").addEventListener("click", function () {
  let text = document.getElementById("searchBox").value.toLowerCase();

  searchStation(text);
});

function searchStation(text) {
  stationLayer.eachLayer(function (layer) {
    const name =
      layer.feature.properties["Name of filling Station"].toLowerCase();

    if (name.includes(text)) {
      layer.setStyle({ radius: 10, color: "blue" });
      map.panTo(layer.getLatLng());
      layer.openPopup();
    } else {
      layer.setStyle({ radius: 7, color: "#000" });
    }
  });
}

// =========================
// FILTERS
// =========================
document.getElementById("priceFilter").addEventListener("change", applyFilters);
document.getElementById("queueFilter").addEventListener("change", applyFilters);

function applyFilters() {
  let priceFilter = document.getElementById("priceFilter").value;
  let queueFilter = document.getElementById("queueFilter").value;

  stationLayer.eachLayer(function (layer) {
    let p = layer.feature.properties;

    let price = Number(p["Price of  PMS"]) || 0;
    let queue = p["Queue Status"];

    let priceMatch =
      priceFilter === "all" ||
      (priceFilter === "cheap" && price <= 900) ||
      (priceFilter === "medium" && price > 900 && price <= 950) ||
      (priceFilter === "expensive" && price > 950);

    let queueMatch = queueFilter === "all" || queue === queueFilter;

    if (priceMatch && queueMatch) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
}

// =========================
// DASHBOARD – CHEAPEST 5
// =========================
function updateDashboard() {
  let sorted = [...allFeatures]
    .map((f) => ({
      ...f,
      price: Number(f.properties["Price of  PMS"]) || 0,
    }))
    .filter((f) => f.price > 300) // remove zeros & bad values
    .sort((a, b) => a.price - b.price);

  let cheapest = sorted.slice(0, 5);

  let list = document.getElementById("cheapestList");
  list.innerHTML = "";

  cheapest.forEach((station) => {
    list.innerHTML += `
            <li>
                <b>${station.properties["Name of filling Station"]}</b><br>
                ₦${station.price}
            </li>
        `;
  });
}
