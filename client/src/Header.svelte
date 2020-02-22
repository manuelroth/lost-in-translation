<script>
  import Legend from "./Legend.svelte";
  export let rows;
</script>

<style>
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: sticky;
    background-color: #f0f0f2;
    top: 0;
    height: 40px;
    padding: 0 8px;
    margin-bottom: 16px;
    z-index: 2;
  }

  .left {
    width: 50%;
  }

  .right {
    width: 50%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-left: 6px;
  }
</style>

<div class="header">
  <div class="left">Original</div>
  <div class="right">
    <div>Translation</div>
    <Legend {rows} />
  </div>
</div>
