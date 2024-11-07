<template>
    <line-chart
        width="100%"
        height="700px"
        :data="data"
        label="y"
        :min="min"
        :max="max"
    />
<!--    xtitle="x"-->
<!--    ytitle="y"-->
<!--    :colors="['#b00', '#666']"-->
<!--    :discrete="true"-->
<!--    :legend="true"-->
</template>

<script>
export default {
  name: 'Plane',
  props: {
    data: Object,
    min: Number,
    max: Number,
  }
}
</script>

<style scoped>
</style>
