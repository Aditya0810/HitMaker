const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const { PythonShell } = require('python-shell');

app.get('/download', (req, res) => {
  var URL = req.query.URL;
  res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(URL, {
    format: 'mp4',
  }).pipe(res);
});

app.use(cors());

app.get('/run-python-script', (req, res) => {
  const URL = req.query.URL;

  // Set the options for PythonShell
  const options = {
    scriptPath: __dirname,
    args: [req.query.URL],
  };

  // Execute the Python script
  PythonShell.run('view_number_graph.py', options, function (err, results) {
    if (err) {
      console.error(err);
      res.status(500).send('Error running Python script');
    } else {
      console.log('Python script completed successfully.');
      console.log('Output:', results);
      res.send('Python script executed successfully');
    }
  });
});

app.listen(8181, () => {
  console.log('Server Works !!! At port 8181');
});

app.get('/', (req, res) => {
  res.send('Server is running');
});
