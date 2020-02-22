<script>
  import Header from "./Header.svelte";
  import Row from "./Row.svelte";
  import data from "./data/data.csv";

  function getEvaluation(item) {
    let evaluation = {
      type: "",
      description: ""
    };
    if (item.wc_diff <= -10) {
      evaluation.type = "error";
    } else if (item.wc_diff <= -4) {
      evaluation.type = "warning";
    }

    evaluation.description = `The translation is ${Math.abs(
      item.wc_diff
    )} words shorter than the original sentence. This could indicate potential problems with the translation.`;

    return evaluation;
  }

  const rows = data.map(item => {
    const evaluation = getEvaluation(item);
    return {
      original: item.de_art,
      translation: item.en_art,
      type: evaluation.type,
      description: evaluation.description
    };
  });
</script>

<style>
  .container {
    z-index: -1;
  }
</style>

<main>
  <Header {rows} />
  <div class="container">
    {#each rows as row}
      <Row data={row} />
    {/each}
  </div>
</main>
