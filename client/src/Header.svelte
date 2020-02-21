<script>
  import Legend from "./Legend.svelte";
  export let data;
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
  }
</style>

<div class="header">
  <div style="width: 50%">Original</div>
  <div
    style="width: 50%; display: flex; flex-direction: row; justify-content:
    space-between;">
    <div>Translated</div>
    <Legend {data} />
  </div>
</div>
