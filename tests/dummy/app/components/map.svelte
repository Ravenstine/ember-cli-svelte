<script>
  import ENV from 'dummy/config/environment';

  const MAPBOX_API = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';

  export let lng, lat, width, height, zoom, alt;

  $: coordinates = `${lng},${lat},${zoom}`;
  $: dimensions = `${width}x${height}`;
  $: accessToken = `access_token=${encodeURIComponent(ENV.MAPBOX_ACCESS_TOKEN)}`;
  $: src = `${MAPBOX_API}/${coordinates}/${dimensions}@2x?${accessToken}`;

  $: if (!alt) alt = `Map image at coordinates ${lat},${lng}`;
</script>

<div class="map">
  <img
    {alt}
    {src}
    width={width}
    height={height}>
</div>
