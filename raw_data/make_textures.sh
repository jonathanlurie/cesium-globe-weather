# This script scales the cloud coverage geotiff values from [0, 100] to [0, 255]
# and saves them as jpeg with a compression at 90% so that they can reasonably be
# used as WebGL textures.

texturelist="texturelist.txt"
touch $texturelist

for x in *.tif; do
  no_ext="${x%.*}"
  echo the file is $no_ext
  scaled="${no_ext}_0-255.tif"
  jpg="${no_ext}.jpg"
  gdal_calc.py -A $x --outfile=$scaled --calc="A*2.5"
  gdal_translate -ot Byte $scaled -of JPEG -co "QUALITY=90" --config GDAL_PAM_ENABLED NO $jpg
  rm $scaled
  echo "$jpg" >> $texturelist
done
