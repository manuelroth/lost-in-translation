<script>
  export let rows;
  let readability = rows.filter(row => row.isHighlighted).length;
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
  <span style="font-weight: bold;">{readability}</span>
  Readability
</div>
