const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const fetch = require('cross-fetch');
const ffmpeg = require('fluent-ffmpeg');
const concat = require('ffmpeg-concat');
const fs = require('fs');

function youtube_parser(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}

// const { PythonShell } = require('python-shell');

app.use(cors());

app.get('/download', (req, res) => {

  var URL = req.query.URL;
  res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(URL, {
    format: 'mp4',
  }).pipe(res);

});

app.get('/hits', async (req, res) => {

  const url = req.query.URL;
  console.log(url)

  const youtube_id = youtube_parser(url);

  const api_response = await (await fetch(`https://yt.lemnoslife.com/videos?part=mostReplayed&id=${youtube_id}`)).json();

  return res.json(api_response.items[0].mostReplayed.heatMarkers);

})

function ffmpegSync(infile, start, duration, outfile) {

  return new Promise((resolve, reject) => {

    // resolve if file already exists
    if (fs.existsSync(outfile)) {
      console.log(`file ${outfile} already exists`)
      return resolve();
    }

    console.log(`splitting ${infile} from ${start} to ${start+duration} to ${outfile}`)

    ffmpeg(infile)
      .setStartTime(start)
      .setDuration(duration)
      .save(outfile)
      .on('end', resolve)
      .on('error', reject)
  })
}

app.get('/video-best-parts', async (req, res) => {

  const url = req.query.URL;
  console.log(url)

  const youtube_id = youtube_parser(url);

  if (fs.existsSync(`./videos/${youtube_id}-best-parts.mp4`)) {
    console.log("video already downloaded")
    return res.download(`./videos/${youtube_id}-best-parts.mp4`);
  }

  const api_response = await (await fetch(`https://yt.lemnoslife.com/videos?part=mostReplayed&id=${youtube_id}`)).json();

  let heat_markers;
  try {
    heat_markers = api_response.items[0].mostReplayed.heatMarkers.filter(m => (m.heatMarkerRenderer.heatMarkerIntensityScoreNormalized > 0.5))
  } catch (e) {
    return res.status(500).json({
      success: "false",
      error: e
    })
  }

  const video_file_name = `./videos/${youtube_id}.mp4`;

  const on_video_downloaded = async () => {

    console.log("splitting :)")
    for (let [index, heat_marker] of heat_markers.entries()) {
      heat_marker = heat_marker.heatMarkerRenderer;
      await ffmpegSync(video_file_name, heat_marker.timeRangeStartMillis/1000, heat_marker.markerDurationMillis/1000, `./videos/${youtube_id}-${index}.mp4`);
    }

    concat({
      output: `./videos/${youtube_id}-best-parts.mp4`,
      videos: heat_markers.map((_, index) => `./videos/${youtube_id}-${index}.mp4`),
      transition: {
        name: 'directionalWipe',
        duration: 500,
      },
    }).then(() => {
      console.log('done!');
      res.download(`./videos/${youtube_id}-best-parts.mp4`);
    });

  }

  // if file does not exist, download it
  if (!fs.existsSync(video_file_name)) {
    console.log("downloading video")
    ytdl(url, { format: 'mp4', quality: "lowest" }).pipe(fs.createWriteStream(video_file_name)).on('close', on_video_downloaded);
  } else {
    console.log("video already downloaded")
    await on_video_downloaded();
  }
    
})

// app.get('/run-python-script', (req, res) => {
//   const URL = req.query.URL;

//   // Set the options for PythonShell
//   const options = {
//     scriptPath: __dirname,
//     args: [req.query.URL],
//   };

//   // Execute the Python script
//   PythonShell.run('view_number_graph.py', options, function (err, results) {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Error running Python script');
//     } else {
//       console.log('Python script completed successfully.');
//       console.log('Output:', results);
//       res.send('Python script executed successfully');
//     }
//   });
// });

app.listen(8181, () => {
  console.log('Server Works !!! At port 8181');
});

app.get('/', (req, res) => {
  res.send('Server is running');
});
