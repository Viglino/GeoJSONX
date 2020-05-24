# GeoJSONX
*Compress (minify) GeoSJON file*

Note that the encoding schema is not stable yet — it may still change as I get community feedback.

[GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) is an open standard format designed for representing simple geographical features. It is widly supported by all major mapping libraries like [Leaflet](https://leafletjs.com/),  [OpenLayers](https://openlayers.org/) or [D3.js](https://d3js.org/).
Any .geojson file in a GitHub repository are now [automatically rendered as an interactive, browsable map](https://github.blog/2013-06-13-there-s-a-map-for-that/), annotated with your geodata.

GeoJSONh as many advantages: it is well supported, simple to understand and human readable, easy to parse and integrate as JSON data. 

**But it is awfully inefficient for data storage and transfer.**

If you're Using large data sets, you know what I mean. GeoJSON is redondant (each keys are repeated on each features) and geometry are represented as a sequence of coordinates that may have up to 10-12 characters...
If you want to spare disk space, bandwidth and transfer time.

[Binary format](https://github.com/mapbox/geobuf) could be a good alternative, but I wanted a format I can extend easily and include in an other JSON structure (such as a map). 

Simple tricks may help to make GeoJSON files smaller, like removal of whitespaces and newlines, rounding and filtering coordinates. But there’s more we can do to achieve even better results.

## Dealing with coordinates




## More to read
* [Speed up web maps - minify geojson](http://igortihonov.com/2014/11/12/speedup-web-maps-minify-geojson/) - [by Igor Tihonov](https://github.com/igorti/geojson-minifier)
* [How to minify GeoJSON files? by Bjørn Sandvik](https://blog.mastermaps.com/2012/11/how-to-minify-geojson-files.html)
* [An incomplete comparison of geospatial file formats](https://medium.com/@diogok/an-incomplete-comparison-of-geospatial-file-formats-bd6c870793e1)
* [Switch from Shapefile](http://switchfromshapefile.org/)
