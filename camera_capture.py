import sys
from picamera2 import Picamera2
import time

filename = sys.argv[2]
print("Saving pic to " + filename)

picam2 = Picamera2()
picam2.start()

picam2.capture_file(filename)
time.sleep(2)

