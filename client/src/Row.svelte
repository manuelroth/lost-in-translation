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

  .highlight {
    position: relative;
    display: inline-block;
  }

  .highlight .tooltiptext {
    visibility: hidden;
    width: 100%;
    background-color: #f9f9f9;
    color: black;
    padding: 8px;
    -webkit-box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.75);
    box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.75);

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
  }

  .highlight:hover .tooltiptext {
    visibility: visible;
  }
</style>

<main>
  <div class="row">
    <div class="left">{data.original}</div>
    <div class="right">
      {#if data.type}
        <div class="highlight">
          <span class="highlight--{data.type}">{data.translation}</span>
          <div class="tooltiptext">{data.description}</div>
        </div>
      {:else}{data.description}{/if}
    </div>
  </div>
</main>
