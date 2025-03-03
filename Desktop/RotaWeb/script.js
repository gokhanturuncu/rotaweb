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

function calculateFuelConsumption(distanceKm, fuelConsumption) {
    return (distanceKm * fuelConsumption) / 100; // Litres of fuel used
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

    directionsService.route(request, async function (result, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(result);
            let optimizedOrder = result.routes[0].waypoint_order;
            let optimizedLocations = [origin, ...optimizedOrder.map(i => locations[i + 1]), destination];

            let optimizedDistance = 0;
            let optimizedTime = 0;
            for (let i = 0; i < result.routes[0].legs.length; i++) {
                optimizedDistance += result.routes[0].legs[i].distance.value; // Metre cinsinden
                optimizedTime += result.routes[0].legs[i].duration.value; // Saniye cinsinden
            }

            let nonOptimizedRequest = {
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                optimizeWaypoints: false, // Optimizasyon yok
                travelMode: "DRIVING"
            };

            directionsService.route(nonOptimizedRequest, async function (nonOptimizedResult, nonOptimizedStatus) {
                if (nonOptimizedStatus === "OK") {
                    let totalDistance = 0;
                    let totalTime = 0;
                    for (let i = 0; i < nonOptimizedResult.routes[0].legs.length; i++) {
                        totalDistance += nonOptimizedResult.routes[0].legs[i].distance.value;
                        totalTime += nonOptimizedResult.routes[0].legs[i].duration.value;
                    }

                    let optimizedDistanceKm = optimizedDistance / 1000;
                    let totalDistanceKm = totalDistance / 1000;
                    let distanceSaved = totalDistanceKm - optimizedDistanceKm;

                    let optimizedTimeMin = Math.round(optimizedTime / 60);
                    let totalTimeMin = Math.round(totalTime / 60);
                    let timeSaved = totalTimeMin - optimizedTimeMin;

                    // Yakıt tüketimi hesaplama (Binek Araç ve Kamyon)
                    const fuelConsumptionCar = 7;  // Binek Araç: 7 lt / 100 km
                    const fuelConsumptionTruck = 25; // Kamyon: 25 lt / 100 km

                    let fuelUsedCarBefore = calculateFuelConsumption(totalDistanceKm, fuelConsumptionCar);
                    let fuelUsedCarAfter = calculateFuelConsumption(optimizedDistanceKm, fuelConsumptionCar);

                    let fuelUsedTruckBefore = calculateFuelConsumption(totalDistanceKm, fuelConsumptionTruck);
                    let fuelUsedTruckAfter = calculateFuelConsumption(optimizedDistanceKm, fuelConsumptionTruck);

                    document.getElementById("result").innerHTML = `
                        <b>Optimize Edilmiş Rota:</b><br> ${optimizedLocations.join(" → ")}
                        <br><br>
                        🚗 <b>Optimize Edilmemiş Mesafe:</b> ${totalDistanceKm.toFixed(2)} km
                        <br>
                        🏁 <b>Optimize Edilmiş Mesafe:</b> ${optimizedDistanceKm.toFixed(2)} km
                        <br>
                        🎯 <b>Kazanç:</b> ${distanceSaved.toFixed(2)} km tasarruf edildi!
                        <br>
                        ⏳ <b>Optimize Edilmemiş Süre:</b> ${totalTimeMin} dakika
                        <br>
                        🚀 <b>Optimize Edilmiş Süre:</b> ${optimizedTimeMin} dakika
                        <br>
                        🔥 <b>Zaman Kazancı:</b> ${timeSaved} dakika
                        <br>
                        ⛽ <b>Binek Araç Yakıt Tüketimi:</b> ${fuelUsedCarAfter.toFixed(2)} L (Önce: ${fuelUsedCarBefore.toFixed(2)} L)
                        <br>
                        🚛 <b>Kamyon Yakıt Tüketimi:</b> ${fuelUsedTruckAfter.toFixed(2)} L (Önce: ${fuelUsedTruckBefore.toFixed(2)} L)
                    `;
                }
            });
        } else {
            document.getElementById("result").innerText = "Rota oluşturulamadı!";
        }
    });
}
