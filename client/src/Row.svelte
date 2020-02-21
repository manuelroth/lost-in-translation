<script>
  export let data;
</script>

<style>
  .row {
    display: flex;
    flex-direction: row;
    margin-bottom: 8px;
  }

  .left,
  .right {
    width: 50%;
  }

  .highlighted {
    color: black;
    text-decoration: none;
    border-bottom: 2px solid #dad6ff;
    box-shadow: 0 -9px #dad6ff inset;
  }
</style>

<main>
  <div class="row">
    <div class="left">{data.original}</div>
    <div class="right">
      <span class:highlighted={data.isHighlighted}>{data.translation}</span>
    </div>
  </div>
</main>
