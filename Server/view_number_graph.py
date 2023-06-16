import requests
import json
import matplotlib.pyplot as plt
import sys
from urllib.parse import urlparse, parse_qs

def getContentFromURL(url):
    return requests.get(url).text

def convertToTime(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes:02d}:{seconds:02d}"

full_url_with_id = str(sys.argv[1])

# Extract the video ID from the YouTube URL
parsed_url = urlparse(full_url_with_id)
query_params = parse_qs(parsed_url.query)
videoId = query_params.get('v')[0]

url = f'https://yt.lemnoslife.com/videos?part=mostReplayed&id={videoId}'
content = getContentFromURL(url)
data = json.loads(content)

Y = []
for heatMarker in data['items'][0]['mostReplayed']['heatMarkers']:
    heatMarker = heatMarker['heatMarkerRenderer']
    intensityScoreNormalized = heatMarker['heatMarkerIntensityScoreNormalized']
    Y.append(intensityScoreNormalized)

videoLength = len(Y)
totalDuration = videoLength * 5

X = [convertToTime(i * totalDuration / videoLength) for i in range(videoLength)]

freq = {}
for i in range(len(X)):
    freq[X[i]] = Y[i]

items = freq.items()
items = sorted(items, key=lambda x:x[1])

a = items[-5:]
print(a)
plt.plot(X, Y)
plt.xlabel('Time')
plt.ylabel('Normalized Intensity Score')
plt.title('Video Heatmap')
plt.xticks(rotation=45)
plt.show()
