<script>
  import Header from "./Header.svelte";
  import Row from "./Row.svelte";
  import data from "./data/data.csv";

  function getEvaluation(item) {
    let evaluation = {
      type: "",
      description: ""
    };
    if (item.wc_diff <= -10 || item.ff_count >= 1) {
      evaluation.type = "error";

      if (item.wc_diff <= -10) {
        evaluation.description =
          "The translation has readability issues. It considerably differs in length from the original sentence. ";
      }

      if (item.ff_count >= 1) {
        evaluation.description =
          evaluation.description +
          "The translation contains an error. Please check the translation for false friends.";
      }
    } else if (item.wc_diff <= -4) {
      evaluation.type = "warning";
      evaluation.description =
        "The translation may have readability issues. It differs in length from the original sentence.";
    }
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
