// =========================
// INITIALIZE MAP
// =========================
var map = L.map("map").setView([4.85, 6.95], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const input = document.getElementById("searchBox");
const container = document.getElementById("foundList");

input.addEventListener("blur", () => {
  setTimeout(() => {
    // Only hide if the newly focused element is NOT inside container
    const active = document.activeElement;
    if (!container.contains(active)) {
      let list = document.getElementById("foundList");
      list.innerHTML = "";
    }
  }, 120); // <-- key: small delay so clicks on results can run first
});

let stationLayer;
let allFeatures = []; // stores all stations

// =========================
// LOAD GEOJSON
// =========================
fetch("map.geojson")
  .then((res) => res.json())
  .then((data) => {
    allFeatures = data.features.map((f) => ({
      ...f,
      price:
        Number(f.properties["Price of  PMS"]) <= 850
          ? 850
          : Number(f.properties["Price of  PMS"]) || 0,
    }));

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

    // console.log({ allFeatures });

    updateDashboard(allFeatures); // Update cheapest 5
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
      <li class="station-item" data-name='${p["Name of filling Station"]}' onclick="searchStation(this)">
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
// document.getElementById("searchBtn").addEventListener("click", function () {
//   let text = document.getElementById("searchBox").value.toLowerCase();

//   searchStation(text);
// });

function searchStation(el) {
  stationLayer.eachLayer(function (layer) {
    const name = layer.feature.properties["Name of filling Station"];

    if (name.includes(el.dataset.name)) {
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
  const priceFilter = document.getElementById("priceFilter").value;
  const queueFilter = document.getElementById("queueFilter").value;

  let filteredData;

  //To filter Cheap
  if (priceFilter === "cheap")
    filteredData = allFeatures.filter((f) => f.price >= 850 && f.price <= 950);

  if (priceFilter === "medium")
    filteredData = allFeatures.filter((f) => f.price >= 901 && f.price <= 950);
  if (priceFilter === "expensive")
    filteredData = allFeatures.filter((f) => f.price >= 951 && f.price <= 1200);
  if (priceFilter === "all_pms") filteredData = allFeatures;

  updateDashboard(filteredData);

  // stationLayer.eachLayer(function (layer) {
  //   let p = layer.feature.properties;

  //   let price = Number(p["Price of  PMS"]) || 0;
  //   let queue = p["Queue Status"];

  //   // let priceMatch =
  //   //   priceFilter === "all" ||
  //   //   (priceFilter === "cheap" && price <= 900) ||
  //   //   (priceFilter === "medium" && price > 900 && price <= 950) ||
  //   //   (priceFilter === "expensive" && price > 950);

  //   // let queueMatch = queueFilter === "all" || queue === queueFilter;

  //   // if (priceMatch && queueMatch) {
  //   //   layer.addTo(map);
  //   // } else {
  //   //   map.removeLayer(layer);
  //   // }
  // });
}

// =========================
// DASHBOARD – CHEAPEST 5
// =========================
function updateDashboard(allFeatures) {
  console.log({ allFeatures });
  let sorted = allFeatures.sort((a, b) => a.price - b.price);

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
