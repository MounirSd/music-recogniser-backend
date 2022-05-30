const youtubedl = require('youtube-dl-exec')
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const videosDir = process.env.VIDEOS_DIR
const ytApiKey = process.env.YT_API_KEY
const { Audd } = require('audd.io');
const audd = new Audd(process.env.AUDDIO_API_KEY);
const logger = require('day-log-savings')

/**
 *
 * @param websocket
 * @param req
 * @returns {WebSocket Connection}
 */
exports.search = async (ws, req) => {
    let fileName = '';
    ws.on('message', async function (message) {
        fileName = uuidv4().replace(/-/g, '') + '.mp3';
        const { url } = JSON.parse(message);
        try {

            await getVideo(fileName, url, ws);
            await trimAudio(fileName, ws);
            const auddRes = await recognizeAudio('out_' + fileName, ws);
            if (auddRes.result == null) {
                ws.send(JSON.stringify({ "message": "done", "error": false, "data": [] }))
            } else {
                const artist = encodeURI(auddRes.result.artist)
                await getPlaylist(artist, ws)
            }

            cleanFiles(fileName)

        } catch (e) {
            ws.send(JSON.stringify({ "message": "Failed to Analyze video", "error": true, "data": [] }))
            logger.write(new Error(e), {stack: false})
            cleanFiles(fileName)
        }

    })
    ws.on('close', (_) => cleanFiles(fileName))
}

/**
 * @description Download Youtube video and saves it as a mp3 file
 * @param fileName (String)
 * @param ytUrl (String)
 * @param ws websocket (Object)
 * @returns {void}
 */
async function getVideo(fileName, ytUrl, ws) {
    logger.write(`Downloading video ${ytUrl}`)
    ws.send(JSON.stringify({ "message": "Analyzing Video", "error": false, "data": [] }))
    return youtubedl(ytUrl, {
        extractAudio: true,
        audioQuality: 5,
        audioFormat: 'mp3',
        output: videosDir + fileName,
    }).then((_) => {
        logger.write(`Saved audio ${videosDir + fileName}`)
    }).catch((e) => {
        ws.send(JSON.stringify({ "message": "Failed to Analyze video", "error": true, "data": [] }))
        throw e
    })
}

/**
 * @description Trim audio to a 1min file
 * @param fileName (String)
 * @param ws websocket (Object)
 * @returns {void}
 */
async function trimAudio(fileName, ws) {
    ws.send(JSON.stringify({ "message": "Analyzing Audio", "error": false, "data": [] }))
    logger.write('Trimming audio ' + videosDir + fileName)
    return new Promise((resolve, reject) => {
        ffmpeg(videosDir + fileName)
            .inputOptions('-t 60')
            .output(videosDir + 'out_' + fileName)
            .on('error', (err) => {
                console.log(`[ffmpeg] error: ${err.message}`);
                reject(err);
            })
            .on('end', () => {
                resolve();
            })
            .save(videosDir + 'out_' + fileName);
    }).then((_) => {
        logger.write('Trimmed audio ' + videosDir + 'out_' + fileName)
    }).catch(e => {
        ws.send(JSON.stringify({ "message": "Failed Analyzing Audio", "error": true, "data": [] }))
        throw e
    })
}

/**
 * @description Recognize artist using Audd.io API
 * @param fileName (String)
 * @param ws websocket (Object)
 * @returns {Promise<void>}
 */
async function recognizeAudio(fileName, ws) {
    logger.write(`Recognizing audio for ${videosDir + fileName}`)
    return audd.fromFile(videosDir + fileName).then(res => {
        logger.write(`Response for audio recognition ${JSON.stringify(res)}`, { stack: false })
        const audioDetails = res;
        return audioDetails;
    }).catch(e => {
        ws.send(JSON.stringify({ "message": "Could not recognize audio", "error": true, "data": [] }))
        throw e
    });
}

/**
 * @description Get a list of YouTube videos for a specified artist
 * @param artist (String)
 * @param ws websocket (Object)
 * @returns {Promise<void>}
 */
async function getPlaylist(artist, ws) {
    logger.write(`Getting playlist for "${artist}" artist`)

    ws.send(JSON.stringify({ "message": "Getting Data", "error": false, "data": [] }))
    return axios
        .get(`https://www.googleapis.com/youtube/v3/search?key=${ytApiKey}&type=video&part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${artist}`)
        .then(ytRes => {
            console.log(`statusCode: ${ytRes.status}`);
            let results = ytRes.data.items;

            results = results.map((result) => {
                return {
                    id: result.id.videoId,
                    title: result.snippet.title,
                    description: result.snippet.description,
                    thumbnail: result.snippet.thumbnails.high.url
                }
            }
            )
            logger.write(`Retrieved playlist for "${artist}"`, { stack: false })
            ws.send(JSON.stringify({ "message": "done", "error": false, "data": results })
            );
        }).catch(e => {
            ws.send(JSON.stringify({ "message": "Failed Getting Data", "error": true, "data": [] }))
            throw e
        })
}

/**
 * @description Clean files after song recognition process
 * @param fileName (String)
 * @returns {void}
 */
function cleanFiles(fileName) {
    const files = [videosDir + fileName, videosDir + 'out_' + fileName, videosDir + fileName + '.part']
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file)
                logger.write(`remove file: ${file}`)
            } catch (e) {
                logger.write(new Error(e), { stack: false })
            }
        }
    })
}