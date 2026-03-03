let chosenPokemon = null;

async function pretraga() {
    const pokemonStatus = await d3.csv('./Pokemon_stats.csv');

    const input = d3.select("#pretraga");
    const opcije = d3.select("#opcije");

    opcije.style("display", "none");

    input.on("input", function () {

        const query = this.value.toLowerCase();

        let filtered = query === ""
            ? []
            : pokemonStatus.filter(p => p.Name.toLowerCase().includes(query))
                .slice(0, 7);

        console.log("FILTERED: ", filtered)

        for (let i = 0; i < pokemonStatus.length; i++) {
            if (pokemonStatus[i].Name.toLowerCase() == query) {
                chosenPokemon = pokemonStatus[i]

                prikaziSve(chosenPokemon);
                break
            }
        }

        if (filtered[0] == chosenPokemon || filtered.length == 0) {
            opcije.style("display", "none")
        }
        else opcije.style("display", "block")

        opcije
            .html("")
            .selectAll("div")
            .data(filtered, d => d.Name)
            .join(
                enter => enter.append("p")
                    .attr("class", "option-item")
                    .text(d => d.Name)
                    .on("click", (event, d) => {
                        input.property("value", d.Name)
                        input.dispatch("input")
                        opcije.html("")
                    }),
                update => update.text(d => d.Name),
                exit => exit.remove()
            );
    });

}

function prikaziSve(d) {
    const status = d3.select("#status");
    const slika = d3.select('#slika');

    d3.select("#atribut").dispatch("change");
    status.html("");

    const imageName = d.Name.charAt(0).toUpperCase() + d.Name.slice(1)

    slika.html("")
        .append("img")
        .attr("src", `images/${imageName}/0.jpg`)
        .attr("alt", d.Name)
        .on("error", function () {
            d3.select(this).attr("src", "images/not_found.png");
        });

    const statsToShow = ["Type 1", "Type 2", "Total", "HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed", "Generation", "Legendary"];
    const statsList = status.append("ul").attr("class", "stats-list");

    statsToShow.forEach(stat => {
        if (d[stat] != "") {
            statsList.append("li")
                .html(`<strong>${stat}:</strong> ${d[stat]}`);
        }
    });
}

pretraga();