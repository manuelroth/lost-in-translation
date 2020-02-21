<script>
  export let data;
</script>

<style>
  .highlighted {
    color: black;
    text-decoration: none;
    border-bottom: 2px solid #dad6ff;
    box-shadow: 0 -9px #dad6ff inset;
  }
</style>

<div class="highlighted">
  <span style="font-weight: bold;">{data.readability | 1}</span>
  Readability
</div>
