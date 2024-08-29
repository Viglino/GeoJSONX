# GeoJSONX
*Compress (minify) GeoSJON file*

Note that the encoding schema is not stable yet — it may still change as I get community feedback.

[GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) is an open standard format designed for representing simple geographical features. It is widly supported by all major mapping libraries like [Leaflet](https://leafletjs.com/),  [OpenLayers](https://openlayers.org/) or [D3.js](https://d3js.org/).
Any .geojson file in a GitHub repository are now [automatically rendered as an interactive, browsable map](https://github.blog/2013-06-13-there-s-a-map-for-that/), annotated with your geodata.

GeoJSON has many advantages: it is well supported, simple to understand and human readable, easy to parse and integrate as JSON data. 

**But it is awfully inefficient for data storage and transfer.**

If you're using large data sets, you know what I mean. GeoJSON is redundant (each keys are repeated on each features) and geometry are represented as a sequence of coordinates that may have up to 10-12 characters...
Simple tricks may help to make GeoJSON files smaller, like removal of whitespaces and newlines, rounding and filtering coordinates or simplifying property keys. But there’s more we can do to achieve even better results.

If you want to spare disk space, bandwidth and transfer time this is made for you.

Binary format as [GeoBuff](https://github.com/mapbox/geobuf) or [MessagePack](https://github.com/msgpack/msgpack-javascript) could be a good alternative, but I wanted a format I can extend easily and include in an other JSON structure (such as a map). 

## Dealing with coordinates

I first looked at [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) to encode the geometry but the precision limit to 5 digit (6 in better cases) only gives you 10 cm of precision.

### Removing unecessary digits

Using 10 digits for coordinates may quite unecessary  and reducing it should save space.

### Delta and zigzag encoding

Using [delta coordinates] (storing difference between coordinates) and [zigzag encodeing](https://gist.github.com/mfuerstenau/ba870a29e16536fdbaba) let us spare space.

### Base64 encoding

Encoding number using a more efficient method than just using 0-9 characters may also save a lot of space or even more if we use a more long radix.

## Dealing with properties

Storing properties in a lookup table let's us use indexes in the file instead of long property keys.

[Try it online !](https://viglino.github.io/GeoJSONX/)

## More to read
* [Speed up web maps - minify geojson](http://igortihonov.com/2014/11/12/speedup-web-maps-minify-geojson/) - [by Igor Tihonov](https://github.com/igorti/geojson-minifier)
* [How to minify GeoJSON files? by Bjørn Sandvik](https://blog.mastermaps.com/2012/11/how-to-minify-geojson-files.html)
* [An incomplete comparison of geospatial file formats](https://medium.com/@diogok/an-incomplete-comparison-of-geospatial-file-formats-bd6c870793e1)
* [Switch from Shapefile](http://switchfromshapefile.org/)
