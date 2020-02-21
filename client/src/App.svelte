<script>
  import Row from "./Row.svelte";
  let data = [
    [
      "Wegen eines Sprungs in den Bachalpsee und eines Getränks auf der Aussichtsterrasse auf dem Faulhorn, von der aus Eiger, Mönch und Jungfrau zu sehen sind.",
      "Cool off with a jump into the Bachalpsee lake and sip a drink on the Faulhorn’s observation deck. From here, you can see three of the most famous Swiss mountains: Eiger, Mönch and Jungfrau.",
      true
    ],
    [
      "Wegen eines Sprungs in den Bachalpsee und eines Getränks auf der Aussichtsterrasse auf dem Faulhorn, von der aus Eiger, Mönch und Jungfrau zu sehen sind.",
      "Cool off with a jump into the Bachalpsee lake and sip a drink on the Faulhorn’s observation deck. From here, you can see three of the most famous Swiss mountains: Eiger, Mönch and Jungfrau.",
      false
    ]
  ];

  let rows = data.map(data => {
    return {
      original: data[0],
      translation: data[1],
      isHighlighted: data[2]
    };
  });
</script>

<style>

</style>

<main>
  {#each rows as row}
    <Row data={row} />
  {/each}
</main>
