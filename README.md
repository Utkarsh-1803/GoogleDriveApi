# Download and Upload Video Project

This Node.js project allows you to download a video file from Google Drive and then upload it to another location. It utilizes the Google Drive API for file management and supports tracking the progress of both download and upload operations.

## Prerequisites

Before using this project, ensure you have the following prerequisites installed:

- Node.js
- NPM (Node Package Manager)
- Google Drive API credentials (`credentials.json`)
- Required Node.js packages (express, googleapis, https, etc.)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/yourproject.git

- Navigate to the project directory:
2. cd yourproject

- Install the required dependencies:
3. npm install

- Set up the Google Drive API credentials by placing the credentials.json file in the project directory.
Start the server:
4. node yourproject.js

USAGE: 

To use this project, follow these steps:

Start the server as mentioned in the installation instructions.

Make a POST request to the /downloadAndUploadVideo endpoint with the following JSON data:

{
  "sourceFolder": "GoogleDriveFolderName",
  "destinationFolder": "GoogleDriveDestinationFolderName",
  "fileName": "VideoFileNameWithExtension"
}

* Replace GoogleDriveFolderName, GoogleDriveDestinationFolderName, and VideoFileName with the appropriate values.

Monitor the progress of the download and upload operations by making a GET request to the 
- /progress endpoint.

The server will respond with status of download and upload process.

* CONTRIBUTING: 

Contributions to this project are welcome. You can contribute by reporting issues, suggesting enhancements, or submitting pull requests.

Contact
If you have any questions or need assistance with this project, feel free to contact:

Email - utkarshisback1803@gmail.com
Project Repository: https://github.com/yourusername/yourproject
