let locations = [];
let autocomplete;

function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("locationInput"),
        { types: ["geocode"], componentRestrictions: { country: "TR" } }
    );

    autocomplete.addListener("place_changed", function () {
        let place = autocomplete.getPlace();
        if (place.geometry) {
            let formattedAddress = place.formatted_address;
            addLocation(formattedAddress);
        }
    });
}

function addLocation(address) {
    if (address) {
        locations.push(address);
        let listItem = document.createElement("li");
        listItem.textContent = address;
        document.getElementById("locationList").appendChild(listItem);
        document.getElementById("locationInput").value = ""; // Input'u temizle
    }
}

async function calculateRoute() {
    const API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Google API Anahtarını ekleyin

    if (locations.length < 2) {
        document.getElementById("result").innerText = "En az 2 durak ekleyin!";
        return;
    }

    let origin = locations[0];
    let destination = locations[locations.length - 1];
    let waypoints = locations.slice(1, locations.length - 1).map(loc => ({ location: loc, stopover: true }));

    let directionsService = new google.maps.DirectionsService();
    let directionsRenderer = new google.maps.DirectionsRenderer();

    let map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: { lat: 41.0082, lng: 28.9784 } // İstanbul koordinatları
    });

    directionsRenderer.setMap(map);

    let request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: true, // OPTİMİZASYONU AKTİF ETTİK! 🚀
        travelMode: "DRIVING"
    };

    directionsService.route(request, function (result, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(result);
            let optimizedOrder = result.routes[0].waypoint_order;
            
            let optimizedLocations = [origin, ...optimizedOrder.map(i => locations[i + 1]), destination];

            // Toplam mesafeyi hesapla
            let totalDistance = 0;
            let optimizedDistance = 0;

            for (let i = 0; i < result.routes[0].legs.length; i++) {
                optimizedDistance += result.routes[0].legs[i].distance.value; // Metre cinsinden
            }

            // Optimize edilmemiş mesafeyi de hesaplayalım
            let nonOptimizedRequest = {
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                optimizeWaypoints: false, // Optimizasyon yok
                travelMode: "DRIVING"
            };

            directionsService.route(nonOptimizedRequest, function (nonOptimizedResult, nonOptimizedStatus) {
                if (nonOptimizedStatus === "OK") {
                    for (let i = 0; i < nonOptimizedResult.routes[0].legs.length; i++) {
                        totalDistance += nonOptimizedResult.routes[0].legs[i].distance.value;
                    }

                    let distanceSaved = (totalDistance - optimizedDistance) / 1000; // Km cinsine çevir
                    let optimizedDistanceKm = optimizedDistance / 1000;
                    let totalDistanceKm = totalDistance / 1000;

                    document.getElementById("result").innerHTML = `
                        <b>Optimize Edilmiş Rota:</b><br> ${optimizedLocations.join(" → ")}
                        <br><br>
                        🚗 <b>Optimize Edilmemiş Mesafe:</b> ${totalDistanceKm.toFixed(2)} km
                        <br>
                        🏁 <b>Optimize Edilmiş Mesafe:</b> ${optimizedDistanceKm.toFixed(2)} km
                        <br>
                        🎯 <b>Kazanç:</b> ${distanceSaved.toFixed(2)} km tasarruf edildi!
                    `;
                }
            });
        } else {
            document.getElementById("result").innerText = "Rota oluşturulamadı!";
        }
    });
}
