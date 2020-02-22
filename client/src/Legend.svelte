<script>
  export let rows;
  let errors = rows.filter(row => row.type === "error").length;
  let warnings = rows.filter(row => row.type === "warning").length;
</script>

<style>
  .highlight--warning {
    border-bottom: 2px solid #fdfdaf;
    box-shadow: 0 -9px #fdfdaf inset;
  }

  .highlight--error {
    border-bottom: 2px solid #ff9aa2;
    box-shadow: 0 -9px #ff9aa2 inset;
  }
</style>

<div class="legend">
  {#if errors > 0}
    <span class="highlight--error">
      <span style="font-weight: bold;">{errors}</span>
      errors
    </span>
  {/if}
  {#if warnings > 0}
    <span class="highlight--warning">
      <span style="font-weight: bold;">{warnings}</span>
      warnings
    </span>
  {/if}

</div>
