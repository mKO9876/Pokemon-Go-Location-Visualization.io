async function graf() {
    //animacije!!!

    const select = d3.select("#atribut");
    const pokemonGeo = await d3.csv('./Pokemon_geo_data.csv');

    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#linijski_graf")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    select.on("change", function (event) {
        svg.html("");
        const selectedAttribute = d3.select(this).property("value");
        console.log(selectedAttribute)

        //population_density i temeprature moram uredit

        let grouped = []
        if (selectedAttribute === "temperature") {
            grouped = pokemonGeo
                .filter(s => s.Name === chosenPokemon.Name)
                .reduce((acc, curr) => {
                    const temp = +curr[selectedAttribute];
                    let bin;

                    if (temp < 10) bin = "below 10";
                    else if (temp >= 10 && temp < 20) bin = "10 - 20";
                    else if (temp >= 20 && temp < 30) bin = "20 - 30";
                    else bin = "30+";

                    acc[bin] = (acc[bin] || 0) + 1;
                    return acc;
                }, {});
        }
        
        else {
            grouped = pokemonGeo
                .filter(s => s.Name === chosenPokemon.Name)
                .reduce((acc, curr) => {
                    const key = curr[selectedAttribute];
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
        }

        let finalData;

        if (selectedAttribute == "terrainType") {
             finalData = Object.entries(grouped).map(([key, value]) => ({
                category: terrainType(key),
                count: value
            }));
        }

        else {
            finalData = Object.entries(grouped).map(([key, value]) => ({
                category: key,
                count: value
            }));
        }



        finalData.sort((a, b) => b.count - a.count);



        // X axis
        var x = d3.scaleBand()
            .range([0, width])
            .domain(finalData.map(d => d.category))
            .padding(0.2);


        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");


        const maxVal = d3.max(Object.values(grouped));

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, maxVal * 1.1]);

        svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("mybar")
            .data(finalData)
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.category); })
            .attr("y", function (d) { return y(d.count); })
            .attr("width", x.bandwidth())
            .attr("height", function (d) { return height - y(d.count); })
            .attr("fill", "#69b3a2")


    });

}


function terrainType(type){
    console.log(typeof(type));

    if (type == 0) return "Water Bodies";
    else if (type == 1) return "Evergreen Needleleaf Forest";
    else if (type == 2) return "Evergreen Forest";
    else if (type == 4) return "Deciduous Forest";
    else if (type == 5) return "Mixed Forest";
    else if (type == 7) return "Open Shrublands";
    else if (type == 8) return "Woody Savannas";
    else if (type == 9) return "Savannas";
    else if (type == 10) return "Grasslands";
    else if (type == 11) return "Permanent Wetlands";
    else if (type == 12) return "Croplands";
    else if (type == 13) return "Urban and Built-Up";
    else if (type == 14) return "Cropland";
    else if(type == 16) return "Barren";
    else return type;
}

graf();