import sys
from picamera2 import Picamera2
import time

filename = sys.argv[2]
print("Taking a pic and saving it to " + filename)

picam2 = Picamera2()
picam2.start()

picam2.capture_file(file_name)
time.sleep(2)

