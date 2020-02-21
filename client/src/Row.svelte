<script>
  export let data;
</script>

<style>
  .row {
    display: flex;
    flex-direction: row;
  }

  .left,
  .right {
    width: 50%;
  }

  .highlighted {
    background-color: red;
  }
</style>

<main>
  <div class="row">
    <div class="left">{data.original}</div>
    <div class="right" class:highlighted={data.isHighlighted}>
      {data.translation}
    </div>
  </div>
</main>
