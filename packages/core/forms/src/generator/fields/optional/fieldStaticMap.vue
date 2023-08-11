<template lang="pug">
img(:src="mapLink")
</template>

<script>
import abstractField from '../abstractField'
import { defaults } from 'lodash'

export default {
  mixins: [abstractField],

  computed: {
    mapLink() {
      let lat, lng, url
      if (this.value) {
        const options = defaults(this.schema.staticMapOptions || {}, {
          lat: 'lat',
          lng: 'lng',
          zoom: 8,
          sizeX: 640,
          sizeY: 640,
        })

        lat = this.value[options.lat]
        lng = this.value[options.lng]

        url = `http://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${options.zoom}&size=${options.sizeX}x${options.sizeY}`

        const props = ['scale', 'format', 'maptype', 'language', 'region', 'markers', 'path', 'visible', 'style', 'key', 'signature']
        for (const prop of props) {
          if (typeof options[prop] !== 'undefined') {
            url += `&${prop}=${options[prop]}`
          }
        }
      }
      return url
    },
  },
}
</script>

<style lang="scss">
.vue-form-generator .field-staticMap img {
  display: block;
  max-width: 100%;
  width: auto;
}
</style>
