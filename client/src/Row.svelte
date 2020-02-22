<script>
  export let data;
</script>

<style>
  .row {
    display: flex;
    flex-direction: row;
    margin-bottom: 12px;
    padding: 0 8px;
  }

  .left,
  .right {
    width: 50%;
  }

  .left {
    padding-right: 6px;
  }

  .right {
    padding-left: 6px;
  }

  .highlight--warning {
    border-bottom: 2px solid #fdfdaf;
    box-shadow: 0 -9px #fdfdaf inset;
  }

  .highlight--error {
    border-bottom: 2px solid #ff9aa2;
    box-shadow: 0 -9px #ff9aa2 inset;
  }
</style>

<main>
  <div class="row">
    <div class="left">{data.original}</div>
    <div class="right">
      <span class="highlight--{data.type}">{data.translation}</span>
    </div>
  </div>
</main>
