
# Music Recogniser

Recognize a YouTube music video and generate a playlist for the same artist.
This is the backend for Music Recogniser. 
You can find the Angular frontend project in this repo : https://github.com/MounirSd/music-recogniser-frontend


## Requirements

To run this project, you should have the follwing installed:

[Node.JS](https://nodejs.org/en/)

[NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

[FFmpeg](https://ffmpeg.org/)

## Installation

Install npm packages

```bash
  npm install
```

To Run this project

```bash
  npm start
```
or for dev:
```bash
  npm run dev
```
## Environment Variables

Add YouTube and Audd.io API keys in the .env file

`YT_API_KEY` , `AUDDIO_API_KEY`



## Deployment

The project run on port `3005` by default, the port can be changed in the `.env` file.
The backend serves the html in the view folder. ex:` localhost:3005/`
The api requests are routed to the controllers. ex: `localhost:3005/api/`.
If you change the port remember to create new angular build with the new port and the new build files to the view folder.
