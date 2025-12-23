/**
 * Port Harcourt GIS Fuel Locator
 * © 2025 Muxty
 * All rights reserved.
 * Unauthorized copying or redistribution without attribution is prohibited.
 */


//To Initialize the map

var map = L.map("map").setView([4.85, 6.95], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const input = document.getElementById("searchBox");
const container = document.getElementById("foundList");

input.addEventListener("focusout", () => {
  setTimeout(() => {
    if (!container.contains(document.activeElement)) {
      container.innerHTML = "";
    }
  }, 150);
});


// input.addEventListener("blur", () => {
//   setTimeout(() => {
//     // Only hide if the newly focused element is NOT inside container
//     const active = document.activeElement;
//     if (!container.contains(active)) {
//       let list = document.getElementById("foundList");
//       list.innerHTML = "";
//     }
//   }, 120); // <-- key: small delay so clicks on results can run first
// });

let stationLayer;
let allFeatures = []; // stores all stations


// Loads GEOJSON

fetch("map.geojson")
  .then(res => res.json())
  .then(data => {

    // Prepare data for filters & dashboard
    allFeatures = data.features.map(f => ({
      ...f,
      price:
        Number(f.properties["Price of  PMS"]) <= 850
          ? 850
          : Number(f.properties["Price of  PMS"]) || 0
    }));

    // Create map layer
    stationLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        const p = feature.properties;

        // Save name for search & dashboard click
        layer.stationName = p["Name of filling Station"];

        const stationId = p["Name of filling Station"]
          .replace(/\s+/g, "_")
          .replace(/[^\w]/g, "");

        const popup = `
          <b>${p["Name of filling Station"]}</b><br>
          <b>Address:</b> ${p["Address"]}<br>
          <b>PMS Price:</b> ₦${p["Price of  PMS"]}<br>
          <hr>

          <b>Comments</b>
          <div id="comments-${stationId}"
               style="max-height:100px; overflow:auto;"></div>

          <input id="input-${stationId}"
                 placeholder="Add comment"
                 style="width:100%; margin-top:5px;" />

          <button onclick="saveComment('${stationId}')"
                  style="width:100%; margin-top:5px;">
            Submit
          </button>
        `;

        layer.bindPopup(popup);

        layer.on("popupopen", () => {
          renderComments(stationId);
        });
      },

      pointToLayer: function (feature, latlng) {
        let price = Number(feature.properties["Price of  PMS"]) || 0;

        let color = price <= 900
          ? "green"
          : price <= 950
          ? "orange"
          : "red";

        return L.circleMarker(latlng, {
          radius: 7,
          fillColor: color,
          color: "#000",
          weight: 1,
          fillOpacity: 0.9
        });
      }
    }).addTo(map);

    updateDashboard(allFeatures);
  })
  .catch(err => console.error("GeoJSON error:", err));


    // console.log({ allFeatures });

 


// SEARCH (KEYUP)
 
document
  .getElementById("searchBox")
  .addEventListener("keyup", async function () {
    let text = this.value.toLowerCase();
   const data = { features: allFeatures };


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


// SEARCH BUTTON

// document.getElementById("searchBtn").addEventListener("click", function () {
//   let text = document.getElementById("searchBox").value.toLowerCase();

//   searchStation(text);
// });

  // function searchStation(el) {
  //   const targetName = el.dataset.name.toLowerCase().trim();

  //   stationLayer.eachLayer(function (layer) {
  //     const layerName = layer.stationName.toLowerCase().trim();

  //     // reset all markers first
  //     layer.setStyle({ radius: 7, color: "#000" });

  //     if (layerName === targetName) {
  //       layer.setStyle({ radius: 10, color: "blue" });
  //       map.setView(layer.getLatLng(), 16);
  //       layer.openPopup();
  //     }
  //   });
  // }
  
  function searchStation(el) {
  if (!stationLayer) {
    console.warn("Map layer not ready yet");
    return;
  }

  const targetName = el.dataset.name.toLowerCase().trim();

  stationLayer.eachLayer(function (layer) {
    const layerName = layer.stationName.toLowerCase().trim();

    // reset styles
    layer.setStyle({ radius: 7, color: "#000" });

    if (layerName === targetName) {
      layer.setStyle({ radius: 10, color: "blue" });
      map.setView(layer.getLatLng(), 16);
      layer.openPopup();
    }
  });
}


 
// Filters
 
document.getElementById("priceFilter").addEventListener("change", applyFilters);
document.getElementById("queueFilter").addEventListener("change", applyFilters);

function applyFilters() {
  const priceFilter = document.getElementById("priceFilter").value;
  const queueFilter = document.getElementById("queueFilter").value;

  let filteredData = allFeatures;

  //To filter Cheap
  if (priceFilter === "cheap")
    filteredData = allFeatures.filter((f) => f.price >= 850 && f.price <= 950);

  if (priceFilter === "medium")
    filteredData = allFeatures.filter((f) => f.price >= 901 && f.price <= 950);
  if (priceFilter === "expensive")
    filteredData = allFeatures.filter((f) => f.price >= 951 && f.price <= 1200);
  if (priceFilter === "all_pms") filteredData = allFeatures;
  // console.log("allFeatures");

  //to filter Queue 
  if (queueFilter === "None")
    filteredData = filteredData.filter((f) => f.properties["Queue Status"] === "None");  

  if (queueFilter === "Short")
    filteredData = filteredData.filter((f) => f.properties["Queue Status"] === "Short");

  if (queueFilter === "Medium")
    filteredData = filteredData.filter((f) => f.properties["Queue Status"] === "Medium");

  if (queueFilter === "Long")
    filteredData = filteredData.filter((f) => f.properties["Queue Status"] === "Long");

  if (queueFilter === "all")
    filteredData = filteredData;
  

  updateDashboard(filteredData);

  console.log("filteredData");
  
  

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
function updateDashboard(features) {
  let sorted = [...features].sort((a, b) => a.price - b.price);
  let cheapest = sorted.slice(0, 5);

  let list = document.getElementById("cheapestList");
  list.innerHTML = "";

  cheapest.forEach((station) => {
    const name = station.properties["Name of filling Station"];

    list.innerHTML += `
      <li style="cursor:pointer"
          onclick="openStationFromDashboard('${name}')">
        <b>${name}</b><br>
        ₦${station.price}
      </li>
    `;
  });
}


function saveComment(stationId) {
  const input = document.getElementById(`input-${stationId}`);
  const text = input.value.trim();

  if (!text) return;

  const key = `comments_${stationId}`;

  let comments = JSON.parse(localStorage.getItem(key)) || [];

  comments.push({
    message: text,
    time: new Date().toLocaleString()
  });

  localStorage.setItem(key, JSON.stringify(comments));

  input.value = "";

  renderComments(stationId);
}

function renderComments(stationId) {
  const key = `comments_${stationId}`;
  const comments = JSON.parse(localStorage.getItem(key)) || [];

  const container = document.getElementById(`comments-${stationId}`);
  if (!container) return;

  container.innerHTML = "";

  comments.forEach(c => {
    container.innerHTML += `
      <div style="border-bottom:1px solid #ddd; margin-bottom:4px;">
        <small>${c.time}</small><br>
        ${c.message}
      </div>
    `;
  });
}
 
function openStationFromDashboard(stationName) {
  stationLayer.eachLayer((layer) => {
    if (layer.stationName === stationName) {
      map.setView(layer.getLatLng(), 16);
      layer.openPopup();
    }
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.log("SW error:", err));
}

