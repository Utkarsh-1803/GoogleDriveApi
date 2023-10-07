// async function uploadChunk() {
//     const chunkSize = 10 * 1024 * 1024; // chunk size
//     let endByte = startByte + chunkSize - 1;
//     if (endByte > fileSize) {
//         endByte = fileSize - 1;
//     }
//     const chunk = fs.createReadStream(filePath, { start: startByte, end: endByte });
//     const options = {
//         method: 'PUT',
//         headers: {
//             'Content-Length': endByte - startByte + 1,
//             'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
//         },
//     };

//     const req = https.request(uploadUrl, options, async (res) => {
//         if (res.statusCode === 200 || res.statusCode === 201) {
//             console.log(`Uploaded Progress: ${100}%`);
//             progress.upload = 100;
//             console.log("Chunk successfully uploaded");
//             return {success : true};
//         } else {
//             console.error(`Error uploading chunk. Status code: ${res.statusCode}`);
//             let bytes = res.rawHeaders[5].split('-')[1];
//             if (res.statusCode === 308) {
//                 startByte = Number(bytes);
//                 // Calculate progress based on downloaded bytes and arbitrary total bytes
//                 const progressBar = (bytes / fileSize) * 100;
//                 console.log(`Uploaded Progress: ${progressBar.toFixed(2)}%`);
//                 progress.upload = Number(progressBar.toFixed(2)) + '%';
//                await uploadChunk(); // called recursion to upload next chunk
//             }
//         }
//     });

//     req.on('error', (error) => {
//         console.error('Request error:', error);
//         return {success: false}
//     });
//     chunk.pipe(req);
// }