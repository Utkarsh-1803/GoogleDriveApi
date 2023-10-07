// require express for setting up the express server
const express = require("express");
const app = express();
const fs = require('fs'); // Import the 'fs' module for creating write streams
const fsPromises = require('fs').promises; // Import 'fs.promises' for async file operations
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const https = require('https');
// set up the port number
const port = 8080;
// to use encrypted data
app.use(express.urlencoded());

const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is

// Construct the URL for the specific file you want to download
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Track download and upload progress
const progress = {
    download: 0,
    upload: 0,
};

// use express router
app.get("/", (req, res) => {
    return res.json(400, {
        message: "Please request the correct routes!",
    });
});

// route to get progress of download and upload
app.get('/progress', (req, res) => {
    return res.json(progress);
});

// download and Upload Video Task
app.get("/downloadAndUploadVideo", async (req, res) => {
    try {
        if (req.body && req.body.sourceFolder && req.body.destinationFolder && req.body.fileName) {
            const authClient = await authorize();
            let downloadResponse = await downloadFileFromFolder(authClient, req.body.sourceFolder, req.body.fileName);
            console.log("downloadResponse is", downloadResponse);
            if (downloadResponse.success) {
                let uploadResponse = await uploadFile(authClient, req.body.destinationFolder);
                console.log("uploadResponse is", uploadResponse);
                if (uploadResponse.success) {
                    return res.json(200, {
                        message: "Video download and upload complete",
                    });
                }
                else {
                    return res.json(500, {
                        message: "Video uploading failed",
                    });
                }
            }
            else {
                return res.json(500, {
                    message: "Video downloading failed",
                });
            }
        }
        else {
            return res.json(400, {
                message: "Missing required data",
            });
        }
    } catch (error) {
        console.error('Error in downloading and uploading video', error);
        return res.json(500, {
            error: "Video download and upload failed",
        });
    }
});

// Reads previously authorized credentials from the save file.
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fsPromises.readFile(TOKEN_PATH); // Use fsPromises here
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

// Serializes credentials to a file compatible with GoogleAuth.fromJSON.
async function saveCredentials(client) {
    const content = await fsPromises.readFile(CREDENTIALS_PATH); // Use fsPromises here
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fsPromises.writeFile(TOKEN_PATH, payload); // Use fsPromises here
}

// Load or request authorization to call APIs.
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

// function to start download process
async function downloadFileFromFolder(auth, folderName, fileName) {
    const drive = google.drive({ version: 'v3', auth });
    try {
       // Step 1: find the desired folder
        let res = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        });
        if (res.data.files.length === 0) {
            console.log('Folder not found.');
            return {success: false};
        }
        const folderId = res.data.files[0].id;
        let folderData = await drive.files.list({
            q: `'${folderId}' in parents`,
        });
        // Step 2: Find the file you want to download by name
        const file = folderData.data.files.find(file => file.name === fileName);
        if (!file) {
            console.log('File not found in the folder.');
            return { success: false };
        }
        // Step3: Start downloading the file to your destination
        const dest = fs.createWriteStream(path.join(process.cwd(), 'My_Video.mp4'));
        let response = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
        );
        // Find the size of video
        const contentLength = response.headers['content-length'];
        let downloadedBytes = 0;

        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            // Calculate progress based on downloaded bytes and arbitrary total bytes
            const progressBar = (downloadedBytes / contentLength) * 100;
            console.log(`Download Progress: ${progressBar.toFixed(2)}%`);
            progress.download = progressBar.toFixed(2) + '%';
        });

        return await new Promise((resolve, reject) => {
            response.data
                .on('end', () => {
                    console.log('Download completed.');
                    progress.download = 100 + '%';
                    resolve({ success: true });
                })
                .on('error', (err) => {
                    console.error('Download error:', err);
                    reject(err);
                })
                .pipe(dest);
        });
    }
    catch (err) {
        console.error('Error in downloading video', err);
        return { success: false };
    }
}

async function uploadFile(auth, folderName) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        // Step1: Find the destination folder
        let res = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        });
        if (res.data.files.length === 0) {
            console.log('Folder not found.');
            return {success : false};
        }
        const folderId = res.data.files[0].id;

        const body = JSON.stringify({
            'name': 'My_Video.mp4',
            mimeType: 'video/mp4',
            'parents': [folderId],
        });
        const accessToken = 'ya29.a0AfB_byAKtW-6w-jt1h8eCFKVcKVRZWA8FM5OaTGYXwGd8H_oA4oAFnHMXY9MV15kvtpAOsPHu_28nF2vV0r-g3V1wRq_kLjI17bmNqHmZlgL8g4KSP37UstOuf_0Fc2Yi7TtyfKaRtrtb6JRppmN_gN4YmS-KpjNS3LxaCgYKATUSARESFQGOcNnCEK31Zydywtjzq4H256w6Yw0171'
        const option = {
            method: 'POST',
            body,
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Add this header if using OAuth 2.0
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': 'video/mp4', // MIME type of the file
                'X-Upload-Content-Length': '0', // Set to 0 for resumable upload initiation
                'Accept': 'application/json',
            },
        }

        // Step2: Find the resumable location in drive
        const initiateResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', option)

        if (initiateResponse.status !== 200) {
            console.error('Failed to initiate resumable session:', initiateResponse.status);
            return {success: false};
        }
        const uploadUrl = initiateResponse.headers.get('location');

        const filePath = 'My_Video.mp4'; // Replace with the path to your local video file
        // 5MB chunks (adjust as needed)
        const fileSize = fs.statSync(filePath).size;
        let startByte = 0;
        // Step3: Start uploading in chunks

        async function uploadChunk() {
            const chunkSize = 10 * 1024 * 1024; // chunk size
            let endByte = startByte + chunkSize - 1;
            if (endByte > fileSize) {
                endByte = fileSize - 1;
            }
            const chunk = fs.createReadStream(filePath, { start: startByte, end: endByte });
            const options = {
                method: 'PUT',
                headers: {
                    'Content-Length': endByte - startByte + 1,
                    'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
                },
            };
            try {
                const res = await new Promise((resolve, reject) => {
                    const req = https.request(uploadUrl, options, (res) => {
                        resolve(res);
                    });

                    req.on('error', (error) => {
                        reject(error);
                    });

                    chunk.pipe(req);
                });

                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log(`Uploaded Progress: ${100}%`);
                    progress.upload = 100;
                    console.log("Chunk successfully uploaded");
                    return { success: true };
                } else if (res.statusCode === 308) {
                    startByte = Number(res.headers['range'].split('-')[1]) + 1;
                    // Calculate progress based on downloaded bytes and arbitrary total bytes
                    const progressBar = (startByte / fileSize) * 100;
                    console.log(`Uploaded Progress: ${progressBar.toFixed(2)}%`);
                    progress.upload = progressBar.toFixed(2) + '%';
                    return await uploadChunk(); // Recursively upload the next chunk
                } else {
                    console.error(`Error uploading chunk. Status code: ${res.statusCode}`);
                    return { success: false };
                }
            } catch (error) {
                console.error('Error during chunk upload:', error);
                return { success: false };
            }
        }

      return await uploadChunk(); // Start uploading chunks
    }
    catch (err) {
        console.log("error in upload", err)
        return {success : false, error: err}
    }
}

// make the app to listen on asigned port number
app.listen(port, function (err) {
    if (err) {
        console.log(`Error in running the server : ${err}`);
    }
    console.log(`Server is running on port : ${port}`);
});