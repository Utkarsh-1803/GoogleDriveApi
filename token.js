const axios = require('axios');

const clientId = '207085378293-fk3flru0ne9nvbumngelts196nu3pua9.apps.googleusercontent.com';
const clientSecret = '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';
const refreshToken = '1//0gKbOYEnw2iwRCgYIARAAGBASNwF-L9Iryuo-yFxq_bPGycGHhMuLZ73R2l3WXgJhJ3kfn7I6PClvlX6GIT5r8Gs3IbyU-WMn-w0';

axios.post('https://oauth2.googleapis.com/token', null, {
    params: {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    },
})
    .then((response) => {
        if (response.status === 200) {
            const newAccessToken = response.data.access_token;
            console.log('New Access Token:', newAccessToken);
        } else {
            console.error('Failed to refresh access token:', response.statusText);
        }
    })
    .catch((error) => {
        console.error('Error refreshing access token:', error.message);
    });