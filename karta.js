async function karta() {

  //ANIMACIJE OBAVEZNO

  const weather = d3.select('#prognoza');
  const input = d3.select("#pretraga");

  const pokemonGeo = await d3.csv('./Pokemon_geo_data.csv');
  const world = await d3.json("world-geojson.json");

  let currentPokemon;

  const width = 300;
  const height = 200;

  const svg = d3.select("#mapa").append("svg")
    .attr("id", "svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "auto")
    .style("height", "auto");

  const projection = d3.geoMercator()
    .rotate([-10, 0])
    .center([0, 52])
    .scale(400)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const filteredFeatures = world.features.filter(w => w.properties.CONTINENT !== "Antarctica");
  const filteredWorld = {
    type: "FeatureCollection",
    features: filteredFeatures
  };

  projection.fitSize([width, height], filteredWorld);

  svg.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#3965A5")
    .attr("stroke", "white");


  input.on("input.add", function () {
    if (chosenPokemon != currentPokemon) {
      currentPokemon = chosenPokemon

      addOptions(weather, chosenPokemon, pokemonGeo);
      updateMap(pokemonGeo, "all", "none", svg, projection, width, height)
    }
  });


  weather.on("change", function () {
    updateMap(pokemonGeo, this.value, "weather", svg, projection, width, height)
  });
}

function addOptions(weather, chosenPokemon, pokemonGeo) {
  const pokemonSightings = pokemonGeo.filter(s => s.Name === chosenPokemon.Name);

  const customizedWeather = Array.from(new Set(pokemonSightings.map(d => d.weather))).sort();
  const dropdownDataWeather = ["All Weathers", ...customizedWeather];
  weather.selectAll("option")
    .data(dropdownDataWeather)
    .join("option")
    .text(d => d)
    .attr("value", d => d === "All Weathers" ? "all" : d);
}

function updateMap(pokemonGeo, filter, type, svg, projection, width, height) {

  const point_data = d3.select("#point_data");
  const info = d3.select("#info");

  let filteredData = [];
  const pokemonSightings = pokemonGeo.filter(s => s.Name === chosenPokemon.Name);

  if (type == "weather" && filter != "all") filteredData = pokemonSightings.filter(s => s.weather === filter);
  else filteredData = pokemonSightings;

  const grouped = Object.groupBy(filteredData, ({ city }) => city);

  const cityData = Object.entries(grouped).map(([cityName, sightings]) => {
    return {
      city: cityName,
      count: sightings.length,
      lon: +sightings[0].latitude,
      lat: +sightings[0].longitude
    };
  });
  

  const hexbin = d3.hexbin()
    .radius(3)
    .extent([[0, 0], [width, height]])
    .x(d => {
      const p = projection([d.lat, d.lon]);
      return p ? p[0] : null;
    })
    .y(d => {
      const p = projection([d.lat, d.lon]);
      return p ? p[1] : null;
    });


  const validCityData = cityData.filter(d => projection([d.lat, d.lon]) !== null);
  const bins = hexbin(validCityData);

  // Skala boja
  const maxCount = d3.max(bins, b => d3.sum(b, d => d.count)) || 0;

  const color = d3.scaleLinear()
    .domain([0, maxCount])
    .range(["#fcf460", "#af1619"]); 


  svg.selectAll(".hexagon")
    .data(bins)
    .join("path")
    .attr("class", "hexagon")
    .attr("d", hexbin.hexagon())
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .attr("fill", d => {
      const totalCount = d3.sum(d, city => city.count);
      return color(totalCount);
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", "0.2")
    .style("opacity", 0.8)


    .on("mouseenter", function (e, d) {

      point_data.transition().duration(500).style("opacity", 0.9);
      point_data.style("background-color", "rgb(232, 231, 231)")
      d3.select(this).attr("stroke", "black").attr("stroke-width", "0.5");

      point_data.transition().duration(200).style("opacity", .9);

      point_data.html(`
                <strong>Broj pojava:</strong> ${String(d[0].count)}<br/>
                <strong>Regija:</strong> ${d[0].city || "Nepoznato"}
            `)
        .style("left", (e.pageX - 120) + "px")
        .style("top", (e.pageY - 160) + "px");
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", "0.2");
      point_data.transition().duration(500).style("opacity", 0);
    });


  defs = svg.append("defs");

  const gradientId = "legend-gradient";
  const linearGradient = defs.selectAll("#" + gradientId)
    .data([0])
    .join("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");


  linearGradient.selectAll("stop.start")
    .data([0]).join("stop").attr("class", "start")
    .attr("offset", "0%")
    .attr("stop-color", "#fcf460");


  linearGradient.selectAll("stop.end")
    .data([0]).join("stop").attr("class", "end")
    .attr("offset", "100%")
    .attr("stop-color", "#af1619");

  const legendWidth = 80;
  const legendHeight = 8;
  const marginX = 10;
  const marginY = 20;


  const legendGroup = svg.selectAll(".legend-group")
    .data([0])
    .join("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(${width - legendWidth - marginX}, ${height - marginY})`)
    .style("margin", "20px");

  legendGroup.selectAll("rect")
    .data([0]).join("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 3)
    .style("fill", `url(#${gradientId})`);

  legendGroup.selectAll("text.min-label")
    .data([0]).join("text").attr("class", "min-label")
    .attr("x", 0)
    .attr("y", legendHeight + 10)
    .style("font-size", "6px")
    .text("0");

  legendGroup.selectAll("text.max-label")
    .data([maxCount]).join("text").attr("class", "max-label")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 10)
    .style("text-anchor", "end")
    .style("font-size", "6px")
    .text(d => d);

  if (!info.empty()) info.remove();

  if (filteredData.length === 0) {
    d3.select("#mapa").append("div").attr("id", "info").text("No information about this pokemon");
  }
}

karta();
