ffmpeg -i <raw_file_name> -c:v libvpx-vp9 -crf 30 -b:v 800k -filter:v scale=-1:360 -map 0 -segment_time 00:00:05 -f segment temp/output%d.webm